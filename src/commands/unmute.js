const Command = require('../Command');

class Mute extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'unmute';
        this.module = 'Moderation';
        this.cooldown = 3;
        this.permissions = ['manageRoles'];
        this.usage = '[user] (reason)';
        this.description = 'Unmute a user.';
        this.examples = ['Hector', 'Hector appealed.'];
    }

    async execute(msg, args, guildConfig) {
        let user = this.delta.utils.resolveMember(msg.channel.guild, args[0]);
        if (!user) return msg.channel.sendErrorMessage('User not found.');
        const isMod = await this.delta.utils.checkMod(msg.channel.guild, user);
        if (isMod) {
            return msg.channel.sendErrorMessage('That user is a server moderator/manager, I can\'t do that.');
        }
        args.shift();
        let mutedRole = await msg.channel.guild.roles.get(guildConfig.mute.roleID);
        let mutedUsers = await this.delta.mutedUsers.get(msg.channel.guild.id);
    
        const mutedUser = await guildConfig.mute.users.find(usr => usr.ID == user.id);
    
        if (!mutedUser && (mutedRole && !user.roles.includes(mutedRole.id)) && (mutedUsers && !mutedUsers.get(user.id))) return msg.channel.sendErrorMessage('That user is not muted.');
        
        const index = guildConfig.mute.users.indexOf(mutedUser);
        guildConfig.mute.users.splice(index, 1);
        await guildConfig.save();

        let reason = args[0] ? args.join(' ') : 'No reason provided';
        if (reason && reason.length > 512) return msg.channel.sendErrorMessage('The reason has to be lower than 512 characters');
    
        if (user.guild && mutedRole && user.roles.includes(mutedRole.id)) {
            if (!args || !args.length || args.length == 0) user.removeRole(mutedRole.id);
            if (args[0]) user.removeRole(mutedRole.id, encodeURIComponent(reason));
        }
        if (mutedUsers && mutedUsers.get(user.id)) {
            mutedUsers.delete(user.id);
            if (this.delta.mutedUsers.get(msg.channel.guild.id).size == 0) this.delta.mutedUsers.delete(msg.channel.guild.id);
        }
        return msg.channel.sendSuccessMessage(` Unmuted ${user.username}#${user.discriminator}.`).then(() => this.utils.createModLogCase(this.delta, msg.member, user, 'unmute', reason, null));
    }
}
module.exports = Mute;