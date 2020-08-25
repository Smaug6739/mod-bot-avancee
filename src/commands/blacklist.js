const Command = require('../Command');

async function checkGuild(id, delta) {
    const blacklisted = await delta.db.Blacklist.findOne({ ID: id, type: 'guild' }).exec();
    if (!blacklisted) {
        return 'That guild is not in the blacklist.';
    }

    if (blacklisted.blacklisted) {
        return 'That guild is blacklisted.';
    }
    return 'That guild is not blacklisted.';
}

async function checkUser(user, delta) {
    const blacklisted = await delta.db.Blacklist.findOne({ ID: user.id, type: 'user' }).exec();
    if (!blacklisted) {
        return `User ${user.username}#${user.discriminator} (\`${user.id}\`) is not in the blacklist.`;
    }

    if (blacklisted.blacklisted) {
        return `User ${user.username}#${user.discriminator} (\`${user.id}\`) is blacklisted.`;
    }
    return `User ${user.username}#${user.id} (\`${user.id}\`) is not in the blacklist.`;
}

class Blacklist extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'blacklist';
        this.module = 'Bot Admin';
        this.description = 'Manage the bot\'s blacklist';
        this.usage = '[guild ID/user]';
        this.examples = ['Hector', '627967081014624294'];
        this.subcommands = [
            {
                name: 'check',
                execute: async (msg, args) => {
                    const usr = this.delta.utils.resolveUser(args[0]);
                    if (!usr) {
                        try {
                            this.delta.client.getRESTUser(args[0]);
                        } catch (err) {
                            if (err.match('DiscordRESTError [10013]: Unknown User')) {
                                return;
                            }
                            console.error(err);
                        }
                        this.delta.client.createMessage(msg.channel.id, await checkGuild(args[0], this.delta));
                    }
                    this.delta.client.createMessage(msg.channel.id, await checkUser(usr, this.delta));
                },
                description: 'Check if a user is blacklisted',
                usage: '[guild ID/user]',
                examples: ['Hector', '627967081014624294']
            }
        ];
    }

    async execute(msg, args) {
        let blacklisted;
        const user = this.delta.utils.resolveUser(args[0]);
        if (!user) {
            try {
                this.delta.client.getRESTUser(args[0]); 
            } catch (err) { 
                if (err.match('DiscordRESTError [10013]: Unknown User')) {
                    return;
                }
                console.error(err);
            }
            if (!user) blacklisted = await this.delta.db.Blacklist.findOne({ ID: args[0], type: 'guild' }).exec();
            if (!blacklisted || !blacklisted.blacklisted) {
                const doc = new this.delta.db.Blacklist({ ID: args[0], type: 'guild', blacklisted: true});
                doc.save();
                if (!doc) {
                    return msg.channel.sendErrorMessage('Error blacklisting that guild.');
                }
                if (this.delta.client.guilds.has(args[0])) {
                    this.delta.client.leaveGuild(args[0]);
                }
                this.delta.logger.guilds.info(`Blacklisted a guild with ID of "${args[0]}"`);
                msg.channel.sendSuccessMessage(` Blacklisted guild with ID of \`${args[0]}\``);
            } else {
                let blacklist = await Blacklist.deleteOne({ ID: args[0], type: 'guild' }).exec();
                if (blacklist && blacklist.ok > 0) {
                    this.delta.logger.guilds.info(`[BLACKLIST] - Removed blacklist for the guild with ID of "${args[0]}"`);
                    msg.channel.sendSuccessMessage(` Removed guild \`${args[0]}\` from the blacklist.`);
                }
            }
        }
        if (user) blacklisted = await this.delta.db.Blacklist.findOne({ ID: user.id, type: 'user' }).exec();
        if (!blacklisted || !blacklisted.blacklisted) {
            if (user.id == this.delta.owner.id) return msg.channel.sendErrorMessage('I can\'t blacklist that user.');
            const doc = new this.delta.db.Blacklist({ ID: user.id, type: 'user', blacklisted: true });
            doc.save();
            if (!doc) {
                return msg.channel.sendErrorMessage('Error blacklisting that user.');
            }
            this.delta.logger.guilds.info(`Blacklisted user ${user.username}#${user.discriminator} (${user.id})`);
            return msg.channel.sendSuccessMessage(` Blacklisted user ${user.username}#${user.discriminator} (\`${msg.author.id}\`).`);
        } else if (blacklisted && blacklisted.blacklisted) {
            let blacklist = await this.delta.db.Blacklist.deleteOne({ ID: user.id, type: 'user' }).exec();
            if (blacklist && blacklist.ok > 0) {
                this.delta.logger.guilds.info(`Removed user ${user.username}#${user.discriminator} (${user.id}) from the blacklist.`);
                return msg.channel.sendSuccessMessage(` Removed user ${user.username}#${user.discriminator} (\`${user.id}\`) from the blacklist.`);
            }
        }
    }
}
module.exports = Blacklist;