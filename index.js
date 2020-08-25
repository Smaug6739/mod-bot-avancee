/* eslint-disable func-names */
const startDate = new Date();

const config = require('./config');
const mongoose = require('mongoose');
const fs = require('fs');
const MessageHandler = require('./src/MessageHandler');
const Utils = require('./src/Utils');
const DBL = require('dblapi.js');
const signale = require('signale');

signale.config({
    underlineLabel: false,
    displayTimestamp: true,
    types: {
        error: {
            stream: [process.stderr]
        }
    },
    secrets: [config.token].concat(Array.from(config.webhooks).map(w => w.token))
});

const Eris = require('eris-additions')(require('eris'));
Eris.TextChannel.prototype.sendSuccessMessage = function(content, file) {
    return this.createMessage(`${config.emotes.success} ${content}`, file);
};
Eris.Client.prototype.sendSuccessMessage = function(channelID, content, file) {
    return this.createMessage(channelID, `${config.emotes.success} ${content}`, file);
};
Eris.TextChannel.prototype.sendErrorMessage = function(content, file) {
    return this.createMessage(`${config.emotes.error} ${content}`, file);
};
Eris.Client.prototype.sendErrorMessage = function(channelID, content, file) {
    return this.createMessage(channelID, `${config.emotes.error} ${content}`, file);
};

class Delta {
    constructor(config) {
        this.logger = {
            system: new signale.Signale({scope: 'SYSTEM'}),
            load: new signale.Signale({interactive: true, scope: 'LOAD'}),
            guilds: new signale.Signale({scope: 'GUILDS'}),
            signale
        };
        this.client = new Eris.Client(config.token, {
            getAllUsers: true,
            restMode: true,
            defaultImageFormat: 'png',
            defaultImageSize: 1024,
            intents: ['guilds', 'guildMembers', 'guildBans', 'guildEmojis', 'guildWebhooks', 'guildInvites', 'guildPresences', 'guildMessages', 'guildMessageReactions']
        });
        this.emotes = config.emotes;
        this.constants = {colors: require('./src/constants/colors'), badWords: require('./src/constants/badWords')};
        this.owner = config.owner;
        this.utils = new Utils(this);
        this.commands = new Eris.Collection();
        this.messageHandler = new MessageHandler(this);
        this.prefix = config.prefix;
        this.db = { Blacklist: require('./src/models/blacklist'), Guild: require('./src/models/guild'), DBLUser: require('./src/models/dbluser') };
        this._registerCommands();
        this._registerEvents().then(() => this.logger.system.success(`Loaded ${this.client._eventsCount} events`));
        this._catchErrors();
        this._connectDatabase();
        this.client.connect();
        this.mutedUsers = new Eris.Collection();
        this._connectDBLSystem();
    }

    async _registerCommands() {
        // eslint-disable-next-line no-sync
        let commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
        let i = 0;
        this.logger.load.await(`Loading commands - [${i}/${commandFiles.length}]`);
        let erroredCommands = new Map();
        for (const commandFile of commandFiles) {
            try {
                const CommandClass = require(`./src/commands/${commandFile}`);
                const command = new CommandClass(this);
                this.commands.set(command.name, command);
                i++;
                this.logger.load.await(`Loading commands - [${i}/${commandFiles.length}]`);
            } catch (err) {
                erroredCommands.set(commandFile, err);
            }
        }
        this.logger.load.success(`Loaded commands - [${i}/${commandFiles.length}]`);
        if (erroredCommands.size > 0) {
            erroredCommands.forEach(command => {
                this.logger.signale.error(`Error while loading ${erroredCommands.keys().next().value}: ${command.stack}`);
            });
        }
    }

    _catchErrors() {
        process.on('unhandledRejection', err => {
            return this.logger.signale.error(err);
        });
        process.on('uncaughtException', err => {
            return this.logger.signale.error(err);
        });
        process.on('exit', async code => {
            return this.logger.system.fatal(`Shutting down with code ${code}`);
        });
    }
    
    async _connectDatabase() {
        await mongoose.connect(config.mongoDBURL, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(this.logger.system.success('Connected to MongoDB'));
    }

    async _registerEvents() {
        this.client.on('ready', () => require('./src/events/ready')(this, startDate));
        this.client.on('shardDisconnect', error => require('./src/events/shardDisconnect')(this, error));
        this.client.on('guildCreate', guild => require('./src/events/guildCreate')(this, guild));
        this.client.on('guildDelete', guild => require('./src/events/guildDelete')(this, guild));
        this.client.on('messageCreate', async msg => {
            this.messageHandler.handle(msg, this.commands);
        });
        //actionlogs
        this.client.on('channelCreate', channel => require('./src/events/channelCreate')(this, channel));
        this.client.on('channelDelete', channel => require('./src/events/channelDelete')(this, channel));
        this.client.on('channelUpdate', (channel, oldChannel) => require('./src/events/channelUpdate')(this, channel, oldChannel));
        this.client.on('guildMemberAdd', (guild, member) => require('./src/events/guildMemberAdd')(this, guild, member));
        this.client.on('guildMemberRemove', (guild, member) => require('./src/events/guildMemberRemove')(this, guild, member));
        this.client.on('guildBanRemove', (guild, user) => require('./src/events/guildBanRemove')(this, guild, user));
        this.client.on('guildRoleCreate', (guild, role) => require('./src/events/guildRoleCreate')(this, guild, role));
        this.client.on('guildRoleDelete', (guild, role) => require('./src/events/guildRoleDelete')(this, guild, role));
        this.client.on('inviteCreate', (guild, invite) => require('./src/events/inviteCreate')(this, guild, invite));
        this.client.on('guildEmojisUpdate', (guild, emojis, oldEmojis) => require('./src/events/guildEmojisUpdate')(this, guild, emojis, oldEmojis));
        this.client.on('messageUpdate', (message, oldMessage) => require('./src/events/messageUpdate')(this, message, oldMessage));
        this.client.on('messageDelete', message => require('./src/events/messageDelete')(this, message));
        this.client.on('messageDeleteBulk', messages => require('./src/events/messageDeleteBulk')(this, messages));
        this.client.on('guildMemberUpdate', (guild, member, oldMember) => require('./src/events/guildMemberUpdate')(this, guild, member, oldMember));
    }

    async _connectDBLSystem() {
        if (!config.DBLToken) return this.logger.system.info('DBL not configured');

        this.dblClient = new DBL(config.DBLToken, {
            webhookAuth: config.auth,
            webhookPort: '3002'
        }, this.client);
        
        this.dblClient.on('error', err => {
            this.logger.signale.error(err);
        });
        
        this.dblClient.webhook.on('ready', hook => {
            this.logger.system.success(`DBL webhook running on port ${hook.port}`);
        });
        
        this.dblClient.webhook.on('vote', async vote => {
            const guild = this.client.guilds.get(config.supportServerID);
            try {
                const member = guild.members.get(vote.user);
                if (!member) {
                    const rUser = await this.client.getRESTUser(vote.user);
                    return this.client.createMessage('666712304431136769', `${rUser.username}#${rUser.discriminator} upvoted for us on DBL! Thanks :heart: \n*Unfortunately that user is not in the server to claim their points.*`);
                }
                await member.addRole('667451645180903428').catch();
                if (vote.isWeekend) {
                    let user = await this.db.DBLUser.findOne({ID: member.id});
                    if (user) {
                        user.points += 2;
                        await user.save(); 
                    } else {
                        const doc = new this.db.DBLUser({ID: member.id, points: 2});
                        await doc.save();
                    }
                    return this.client.createMessage('666712304431136769', `${member.mention} upvoted for us on DBL during an active voting multiplier! Thanks :heart: \nPoints: **${user.points}**`);
                }
                let user = await this.db.DBLUser.findOne({ID: member.id});
                if (user) {
                    user.points++;
                    await user.save();
                } else {
                    const doc = new this.db.DBLUser({ID: member.id, points: 1});
                    await doc.save();
                }
                return this.client.createMessage('666712304431136769', `${member.mention} upvoted for us on DBL! Thanks :heart: \nPoints: **${user.points}**`);
            } catch (err) {
                this.logger.signale.error(err);
            }
        });
        
    }
}

const delta = new Delta(config);
module.exports = delta;