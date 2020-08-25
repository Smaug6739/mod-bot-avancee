const Command = require('../Command');
const moment = require('moment');
const Eris = require('eris');

class Mute extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'mute';
        this.module = 'Moderation';
        this.cooldown = 3;
        this.permissions = ['manageRoles', 'manageChannels'];
        this.usage = '[user] (time) (reason)';
        this.description = 'Mute a user from talking in the server during an optional time.';
        this.examples = ['Hector', 'Hector 1h spamming'];
    }

    async execute(msg, args, guildConfig) {
        let user = this.delta.utils.resolveMember(msg.channel.guild, args[0]);
        if (!user) {
            return msg.channel.createMessage(`${this.delta.emotes.error} User not found.`);
        }
        if (user.id == this.delta.owner.id || user.id == this.delta.client.user.id) return msg.channel.sendErrorMessage('I can\'t do that.');
        const isMod = await this.delta.utils.checkMod(msg.channel.guild, user);
        if (isMod) {
            return msg.channel.createMessage(`${this.delta.emotes.error} That user is a server moderator/manager, I can't do that.`);
        }
        if (user.id === msg.author.id) {
            return msg.channel.createMessage(`${this.delta.emotes.error} You can't mute yourself.`);
        }
        args.shift();

        let mutedRole = null;
        if (guildConfig.mute.roleID) {
            mutedRole = msg.channel.guild.roles.get(guildConfig.mute.roleID);
        }
        if (!mutedRole) {
            const everyoneRole = msg.channel.guild.roles.get(msg.channel.guild.id);
            mutedRole = await msg.channel.guild.createRole({
                name: 'Muted',
                permissions: everyoneRole.permissions.allow & ~2048 & ~64 & ~2097152,
                color: 0x2f3136,
                hoist: false,
                mentionable: false
            }, 'Delta\'s muted role');
            const channels = Array.from(msg.guild.channels.values());
            channels.forEach(channel => {
                let denyPerm = 0;
                switch (channel.type) {
                case 0:
                    denyPerm = 2112;
                    break;
                case 4:
                    denyPerm = 2099264;
                    break;
                case 2:
                    denyPerm = 2097152;
                    break;
                default:
                    break;
                }
                if (denyPerm > 0) channel.editPermission(mutedRole.id, 0, denyPerm, 'role');
            });
            guildConfig.mute.roleID = mutedRole.id;
        }
        if (user.roles.includes(mutedRole.id) || guildConfig.mute.users.find(usr => usr.ID == user.id)) {
            return msg.channel.sendErrorMessage('That user is already muted.');
        }
        let reason;
    
        let momentMilliseconds;
        if (args && args.length > 0) {
            const muteLength = args[0].match(/[0-9]+|[^0-9]+/gi);
            if (parseInt(muteLength[0], 10)) momentMilliseconds = moment.duration(Number(muteLength[0]), muteLength[1] ? muteLength[1] : 'minutes').asMilliseconds();
            reason = momentMilliseconds ? args.splice(0, 1).join(' ') : args.join(' ');
            reason = reason.length > 0 ? reason : null;
            if (momentMilliseconds) {
                if ((momentMilliseconds > 1814400050 || momentMilliseconds < 60000)) return msg.channel.sendErrorMessage('You can\'t mute a user for more than 3 weeks or less than one minute.');
                let mutedUsers = this.delta.mutedUsers.get(msg.channel.guild.id);
                if (!mutedUsers) {
                    this.delta.mutedUsers.set(msg.channel.guild.id, new Eris.Collection());
                    mutedUsers = await this.delta.mutedUsers.get(msg.channel.guild.id);
                }
                mutedUsers.set(user.id, Date.now() + momentMilliseconds);
                guildConfig.mute.users.push({ID: user.id, expirationDate: Date.now() + momentMilliseconds });
            }
        }
        if (reason && reason.length > 506) return msg.channel.sendErrorMessage('Your reason has to be lower than 506 characters.');
        if (!args || !args.length || args.length === 0) guildConfig.mute.users.push({ID: user.id, expirationDate: null });
        await guildConfig.save();
        if (user.guild) user.addRole(mutedRole.id, encodeURIComponent(`Mute${reason ? ': ' + reason : ''}`));
        this.utils.createModLogCase(this.delta, msg.member, user, 'mute', reason, momentMilliseconds);
        return msg.channel.sendSuccessMessage(` Muted ${user.username}#${user.discriminator}.`);
    }
}
    
module.exports = Mute;