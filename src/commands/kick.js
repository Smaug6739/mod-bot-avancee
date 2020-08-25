const Command = require('../Command');

class Kick extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'kick';
        this.module = 'Moderation';
        this.cooldown = 3;
        this.permissions = ['kickMembers'];
        this.description = 'Kick a user from the server';
        this.usage = '[user] (reason)';
        this.examples = ['Hector', 'Hector Spamming'];
    }

    async execute(msg, args) {
        if (!msg.member.permission.has('kickMembers' || 'manageGuild' || 'administrator')) return;
        let user = this.delta.utils.resolveMember(msg.channel.guild, args[0]);
        if (!user) {
            return msg.channel.sendErrorMessage('User not found.');
        }
        const isMod = await this.delta.utils.checkMod(msg.channel.guild, user);
        if (isMod) {
            return this.delta.client.createMessage(msg.channel.id, `${this.delta.emotes.error} That user is a server admin/manager, I can't do that.`);
        }
        if (user.id === msg.member.id) {
            args.shift();
            return this.delta.client.createMessage(msg.channel.id, `${this.delta.emotes.error} You can't kick yourself, sorry.`);
        }
        let reason = args[0] ? args.join(' ') : 'No reason provided';
        if (reason && reason.length > 512) return msg.channel.sendErrorMessage('The reason has to be lower than 512 characters');
        try {
            if (user.id === this.delta.owner.id || user.id == this.delta.client.user.id) return msg.channel.sendErrorMessage('I can\'t ban that user.');
            await this.delta.client.kickGuildMember(msg.channel.guild.id, user.id, encodeURIComponent(reason));
            msg.channel.sendSuccessMessage(` Succesfully kicked ${user.username}#${user.discriminator}.`);
            return this.utils.createModLogCase(this.delta, msg.member, user, 'kick', reason, null,);
        } catch (err) {
            let er = err.message || err;
            if (er.match('DiscordRESTError [50013]: Missing Permissions') || er.match('DiscordHTTPError [50013]: Missing Permissions')) {
                return `${this.delta.emotes.error} I can't kick that user, they probably have higher roles than me.`;
            }
        }
    }
}
module.exports = Kick;