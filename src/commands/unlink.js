const Command = require('../Command');

class Unlink extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'unlink';
        this.module = 'Administration';
        this.usage = '[server] [channel]';
        this.permissions = ['manageWebhooks'];
        this.description = 'Unlink two channels';
        this.vip = true;
        this.examples = [''];
    }

    async execute(msg, args, guildConfig) {
        const otherGuild = this.delta.utils.resolveGuild(args[0]);
        if (!otherGuild) return msg.channel.sendErrorMessage('Guild not found.');
        const botMember = otherGuild.members.get(this.delta.client.user.id);
        if (!botMember) return msg.channel.sendErrorMessage('The bot is not in the other guild.');
        const otherChannel = this.utils.resolveChannel(otherGuild, args[1]);
        if (!otherChannel || otherChannel.type !== 0) return msg.channel.sendErrorMessage('Channel not found');
        const otherGuildMember = otherGuild.members.get(msg.author.id);
        if (!otherGuildMember.permission.has('administrator') || !otherGuildMember.permission.has('manageGuild')) return msg.channel.sendErrorMessage('You have to be admin in the other guild in order to link it with that one');
        if ((!botMember.permission.has('manageWebhooks') || !otherChannel.memberHasPermission(this.delta.client.user.id, 'manageWebhooks')) && !otherChannel.memberHasPermission(this.delta.client.user.id, 'readMessages')) return msg.channel.sendErrorMessage('I need the `Manage Webhooks` and `Read Messages` permissions in the other channel.');
        const message = await msg.channel.createMessage(`${this.emotes.loading} Loading...`);
        let webhooks = await msg.channel.getWebhooks();
        webhooks = webhooks.map(w => w.id);
        const firstWebhookID = guildConfig.linkedChannels.find(a => a.find(w => webhooks.includes(w))).find(b => webhooks.includes(b));
        if (!firstWebhookID) return message.edit({content: `${this.emotes.error} I couldn't find any channel link for the other channel.`});
        let otherWebhooks = await msg.channel.getWebhooks();
        otherWebhooks = otherWebhooks.map(w => w.id);
        const otherWebhookID = guildConfig.linkedChannels.find(a => a.find(w => otherWebhooks.includes(w))).find(b => webhooks.includes(b));
        if (!otherWebhookID) return message.edit({content: `${this.emotes.error} I couldn't find any channel link for that channel.`});
        const doc = guildConfig.linkedChannels.find(a => a.includes(firstWebhookID) && a.includes(otherWebhookID));
        if (!doc) return message.edit({content: `${this.emotes.error} I couldn't find any channel link for that channel.`});
        const index = guildConfig.linkedChannels.indexOf(doc);
        guildConfig.linkedChannels.splice(index, 1);
        await guildConfig.save();
        const otherGuildDoc = await this.delta.db.Guild.findOne({ID: otherGuild.id});
        const otherDoc = otherGuildDoc.linkedChannels.find(a => a.includes(firstWebhookID) && a.includes(otherWebhookID));
        const otherIndex = otherGuildDoc.linkedChannels.indexOf(otherDoc);
        if (!otherIndex) return message.edit({content: `${this.emotes.error} I couldn't find any channel link for the other channel.`});
        otherGuildDoc.linkedChannels.splice(otherIndex, 1);
        await otherGuildDoc.save();
        return message.edit(`${this.emotes.success} Unlinked channels`);
    }
}
module.exports = Unlink;