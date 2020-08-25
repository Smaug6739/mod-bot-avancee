const moment = require('moment');
require('moment-duration-format');
const ReactionHandler = require('./extensions/ReactionHandler');
const config = require('../config');

class Utils {
    constructor(delta) {
        this.delta = delta;
    }

    resolveMember(guild, arg) {
        if (!arg || !guild || guild.avalaible) {
            return;
        }
  
        let user = guild.members.find(mem => mem.id === arg.replace('!', '').replace(/<@|>/g, '') || mem.user.username.toLowerCase().startsWith(arg.toLowerCase()) || mem.user.username.toLowerCase() === arg.toLowerCase() || `${mem.user.username.toLowerCase()}#${mem.user.discriminator}` === arg.toLowerCase() || (mem.nick && mem.nick.toLowerCase().startsWith(arg)) || (mem.nick && mem.nick.toLowerCase() === arg.toLowerCase()));
  
        return user;
    }

    resolveUser(arg) {
        if (!arg) {
            return;
        }

        const user = this.delta.client.users.find(uzer => uzer.id === arg.replace('!', '').replace(/<@|>/g, '') || uzer.username.toLowerCase().startsWith(arg.toLowerCase()) || uzer.username.toLowerCase() === arg.toLowerCase() || `${uzer.username.toLowerCase()}#${uzer.discriminator}` === arg.toLowerCase());

        return user;

    }

    resolveChannel (guild, arg) {
        if (!guild || !arg) {
            return;
        }

        let channel = guild.channels.find(chan => chan.id === arg || chan.id === arg.replace(/<#|>/g, '') || chan.name === arg.toLowerCase());

        return channel;
    }

    resolveGuild(arg) {
        if (!arg) {
            return;
        }

        let guild = this.delta.client.guilds.find(g => g.id === arg || g.name === arg.toLowerCase());

        return guild;
    }

    resolveRole(guild, arg) {
        if (!guild || !arg) {
            return;
        }

        let role = guild.roles.find(r => r.id === arg || r.id === arg.replace('&', '').replace(/<@|>/g, '') || r.name.toLowerCase().startsWith(arg.toLowerCase()) || r.name === arg.toLowerCase());

        return role;
    }

    isUnicode(str) {
        for (let i = 0, n = str.length; i < n; i++) {
            if (str.charCodeAt( i ) > 255) return true;
            return false;
        }
    }

    async resolveGuildEmoji(guild, arg) {
        if (!guild || !arg) return;

        let emoji = null;
    
        emoji = guild.emojis.find(e => e.id == arg || e.name == arg) || await guild.getRESTEmoji(arg.replace('<:', '').replace('<a:', '').replace('>', '').split(':')[1]).catch(() => null);

        return emoji;
    }

    /**
 * 
 * @param {Object} msg 
 * @param {Object} delta 
 */
    async resolveCommand(msg, delta) {
        if (msg.author.bot) return;
        let prefix;
        if (msg.content.startsWith(delta.prefix)) prefix = delta.prefix;
        if (msg.content.startsWith(`<@${delta.client.user.id}> `) || msg.content.startsWith(`<@!${delta.client.user.id}> `)) prefix = `<@${delta.client.user.id}> `;
        if (msg.content.startsWith(`<@!${delta.client.user.id}> `)) prefix = `<@!${delta.client.user.id}> `;
        if (msg.content.startsWith('$')) prefix = '$';
        const guild = await delta.db.Guild.findOne({ID: msg.channel.guild.id}).exec();
        if (guild && msg.content.startsWith(guild.prefix)) prefix = guild.prefix;
        if (!prefix) return;
        if (msg.channel.type == 1 && msg.author.id !== delta.owner.id) return;

        const isBlacklisted = await delta.db.Blacklist.findOne({ ID: msg.author.id, blacklisted: true, type: 'user' });
        if (isBlacklisted) return;

        let args = msg.content.slice(prefix.length).replace(/\r?\n|\r/g, ' ').split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = delta.commands.get(commandName) || delta.commands.find(command => command.aliases && command.aliases.includes(commandName));
        if (!command) return;
        if (!command.subcommands || args.length == 0) return { prefix, command, args };
        if (!command.subcommands.find(s => s.name == args[0].toLowerCase()) && !command.subcommands.find(s => s.aliases && s.aliases.includes(args[0].toLowerCase()))) return { prefix, command, args };
        const subcommand = command.subcommands.find(s => s.name == args[0].toLowerCase()) || command.subcommands.find(s => s.aliases && s.aliases.includes(args[0].toLowerCase()));
        args = args.slice(1);
        return { prefix, command, subcommand, args };
    }

    /**
     * 
     * @param {Guild} guild 
     * @param {Member} member 
     */
    async checkMod(guild, member) {
        const Guild = require('./models/guild');
        if (!guild.members.get(member.id)) return false;
        const dbGuild = await Guild.findOne({ID: guild.id});
        let isMod = false;
        dbGuild.modRoles.forEach(modRole => {
            if (member.roles.includes(modRole)) isMod = true;
        });
        if (member.permission.has('administrator') || member.permission.has('manageGuild') || (dbGuild.modRoles && dbGuild.modRoles.length > 0 && isMod)) return true;
        return false;
    }

    async sendCommandHelp(msg, command, prefix) {
        const fields = [];
        const mess = {
            title: `<:Delta:709325663269814293> Command: ${prefix}${command.name}`,
            description: '',
        };
        if (command.module) {
            mess.description += `\n**Module:** ${command.module}`;
        }
        if (command.description) {
            mess.description += `\n**Description:** ${command.description}`;
        }
        if (command.usage) {
            mess.description += `\n**Usage:** ${prefix + command.name + ' ' + command.usage}`;
        }
        if (command.aliases) {
            mess.description += `\n${command.aliases.length > 1 ? '**Aliases:** ' : '**Alias:** '}${command.aliases.join(', ')}`;
        }
        if (command.examples) {
            let txt = [];
            for (let example of command.examples) {
                let exs = `${prefix + command.name} ${example}`;
                txt.push(exs);
            }
            mess.description += `\n${command.examples.length > 1 ? '**Examples:**\n' + txt.join('\n'): '**Example:** ' + txt.join('\n')}`;
        }
        if (command.subcommands) {
            let txt = [];
            command.subcommands.forEach(sub => {
                let subCmd = `${prefix + command.name} ${sub.name}`;
                txt.push(subCmd);
            });
            mess.description += `\n${command.subcommands.length > 1 ? '**Subcommands:**\n' + txt.join('\n'): '**Subcommand:** ' + txt.join('')}`;
        }
        if (fields.length > 0) {
            mess.fields = fields;
        }
        return msg.channel.createMessage({ embed: mess });
    }

    // eslint-disable-next-line max-params
    async sendSubcommandHelp(msg, command, subcommand, prefix) {
        const embed = {
            title: `<:Delta:709325663269814293> Subcommand: ${prefix + command.name} ${subcommand.name}`,
            fields: []
        };
        const finale = { name: 'Sub Commands', value: [] };
        let text = `**Sub Command:** ${prefix + command.name} ${subcommand.name}`;
        if (subcommand.module) {
            text += `\n**Module:** ${subcommand.module}`;
        }
        if (subcommand.description) {
            text += `\n**Description:** ${subcommand.description}`;
        }
        if (subcommand.usage) {
            // eslint-disable-next-line no-implicit-coercion
            text += `\n**Usage:** ${prefix + command.name + ' ' + subcommand.name + ' ' + subcommand.usage}`;
        }
        if (subcommand.aliases) {
            text += `\n${subcommand.aliases.length > 1 ? '**Aliases:** ' : '**Alias:** '}${subcommand.aliases.join(', ')}`;
        }
        if (subcommand.examples) {
            let tx = [];
            // eslint-disable-next-line max-depth
            for (let example of subcommand.examples) {
                let ex = `${prefix + command.name} ${subcommand.name} ${example}`;
                tx.push(ex);
            }
            text += `\n${subcommand.examples.length > 1 ? '**Examples:**\n' + tx.join('\n'): '**Example: ** ' + tx.join('')}`;
        }
        finale.value.push(text);
        finale.value = finale.value.join('\n');
        embed.fields.push(finale);
        msg.channel.createMessage({ embed });
    }

    async banUser(delta, msg, user, reason, type) {
        if (user.id == delta.owner.id || user.id == delta.client.user.id) return `${delta.emotes.error} I can't ban that user.`;
        if (reason && reason.length > 512) return `${delta.emotes.error} The reason has to be lower than 512 characters`;
        try {
            await delta.client.banGuildMember(msg.channel.guild.id, user.id, 7, encodeURIComponent(reason));
            return `${delta.emotes.success} Successfully banned ${user.username}#${user.discriminator}.`.then(() => this.createModLogCase(this.delta, msg.member, user, type, reason, null));
        } catch (err) {
            if (err.message.match('DiscordRESTError [50013]: Missing Permissions') || err.message.match('DiscordHTTPError [50013]: Missing Permissions')) {
                return `${delta.emotes.error} I can't ban that user, they probably have higher roles than me.`;
            }
        }
    }

    async createReactionMenu(msg, delta) {
        const successEmote = delta.emotes.success.replace('<', '').replace('>', '').replace('a:', '');
        const errorEmote = delta.emotes.error.replace('<', '').replace('>', '').replace('a:', '');
        msg.addReaction(successEmote);
        msg.addReaction(errorEmote);
    }

    /**
 * 
 * @param {Object} delta 
 * @param {Object} moderator 
 * @param {Object} user 
 * @param {string} type 
 * @param {string} reason 
 * @param {Number} time 
 * @param {Object} guild 
 */
    async createModLogCase(delta, moderator, user, type, reason, time) {
        const date = new Date();
        const guild = moderator.guild;
        const guildDB = await delta.db.Guild.findOne({ ID: guild.id });
        // eslint-disable-next-line
        let highestCase = guildDB.moderationCases.length > 0 ? Math.max.apply(Math, guildDB.moderationCases.map(c => c.caseID)) : 0;
        highestCase += 1;
        guildDB.moderationCases.push({
            userID: user.id,
            actionType: type,
            moderator: moderator.id,
            reason: reason || null,
            caseID: highestCase,
            date
        });
        await guildDB.save();

        if (!guildDB.modLogChannel || type == 'massban') return;

        user = user.user || user;

        if (guildDB.dmUsers) user.getDMChannel().then(channel => channel.createMessage(`You have been ${type.endsWith('e') ? type + 'd' : type + 'ed'} in **${guild.name}**. ${reason && reason !== 'No reason provided' ? `\nReason: ${reason}` : ''}`)).catch();

        let color = type.startsWith('un') ? delta.constants.colors.green : delta.constants.colors.red;

        const modLogChannel = guild.channels.get(guildDB.modLogChannel);
        const embed = {
            color,
            author: {
                name: `${user.username}#${user.discriminator}`,
                icon_url: user.avatarURL ? user.avatarURL : user.defaultAvatarURL
            },
            title: `${type.charAt(0).toUpperCase() + type.substring(1)} | Case ${highestCase}`,
            fields: [
                {
                    name: 'User',
                    value: `${user.username}#${user.discriminator}`,
                    inline: true
                },
                {
                    name: 'Moderator',
                    value: moderator.mention,
                    inline: true
                }
            ],
            footer: {
                text: `ID: ${user.id}`
            },
            timestamp: date
        };
        if (time && time > 0) embed.fields.push({ name: 'Duration', value: moment.duration(time).format([moment.duration(1, 'minute'), moment.duration(1, 'hour'), moment.duration(1, 'day')],' D [days], H [hours], m [minutes]'), inline: true });
        if (reason && reason !== 'No reason provided') embed.fields.push({ name: 'Reason', value: reason, inline: true });

        return modLogChannel.createMessage({embed}).catch();
    }

    /**
     * 
     * @param {Object} delta 
     * @param {Object} message 
     * @param {String} emote 
     * @param {Object} role 
     */

    async listenToReactionRole(delta, message, emote, role) {
        if (!emote.id && !this.isUnicode(emote)) emote = await this.resolveGuildEmoji(message.channel.guild, emote);
        // eslint-disable-next-line new-cap
        const reactionListener = new ReactionHandler.continuousReactionStream(
            message,
            (userID) => !message.channel.guild.members.get(userID).bot,
            true
        );
        reactionListener.on('reacted', async(event) => {
            const user = delta.utils.resolveMember(message.channel.guild, event.userID);
            if (user.bot) return;
            if ((event.emoji.id && event.emoji.id !== emote.id) || (!event.emoji.id && event.emoji.name !== emote)) return;
            if (user.roles.includes(role.id)) return user.removeRole(role.id).catch();
            return user.addRole(role.id).catch();
        });
        reactionListener.on('unReacted', async(event) => {
            const user = delta.utils.resolveMember(message.channel.guild, event.userID);
            if (user.bot) return;
            if ((event.emoji.id && event.emoji.id !== emote.id) || (!event.emoji.id && event.emoji.name !== emote)) return;
            if (!user.roles.includes(role.id)) return user.addRole(role.id).catch();
            return user.removeRole(role.id).catch();
        });
    }

    isVIP(delta, user) {
        const supportServer = delta.client.guilds.get(config.supportServerID);
        const boosterRole = supportServer.roles.find(r => r.name == 'Nitro Booster');
        if (user.id == config.owner.id || (delta.dblClient && delta.dblClient.hasVoted(user.id)) || (boosterRole && supportServer.members.get(user.id) && supportServer.members.get(user.id).roles.includes(boosterRole.id))) return true;
        return false;
    }
}

module.exports = Utils;
