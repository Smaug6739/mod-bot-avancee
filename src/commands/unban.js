const Command = require('../Command');

class Unban extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'unban';
        this.module = 'Moderation';
        this.cooldown = 5;
        this.permissions = ['banMembers'];
        this.usage = '[user ID] [reason]';
        this.description = 'Unban a user';
        this.examples = ['Hector appealed'];
    }

    async execute(msg, args) {
        let user = await this.delta.client.getRESTUser(args[0]).catch(() => msg.channel.sendErrorMessage('User not found.'));
        let reason = args[1] ? args.splice(0, 1).join(' ') : 'No reason provided.';
        if (reason && reason.length > 512) return msg.channel.sendErrorMessage('The reason has to be lower than 512 characters');
        await this.delta.client.unbanGuildMember(msg.channel.guild.id, user.id, encodeURIComponent(reason));
        return msg.channel.sendSuccessMessage(` Succesfully unbanned ${user.username}#${user.discriminator}.`).then(() => this.utils.createModLogCase(this.delta, msg.member, user, 'unban', reason, null));
    }
}
module.exports = Unban;