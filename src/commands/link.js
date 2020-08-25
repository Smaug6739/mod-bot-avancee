const Command = require('../Command');

class Link extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'link';
        this.module = 'Administration';
        this.usage = '[server] [channel]';
        this.permissions = ['manageWebhooks'];
        this.description = 'Link two channels from different servers, messages from the current channel will be sent to the other one with webhooks and so on.';
        this.vip = true;
        this.examples = [''];
    }

    async execute(msg, args, guildConfig) {
        if ((guildConfig.linkedChannels.length > 1 && !guildConfig.premium) || (guildConfig.linkedChannels.length > 3 && guildConfig.premium)) return msg.channel.sendErrorMessage('You have reached the limit of linked channels in that server.');
        const otherGuild = this.delta.utils.resolveGuild(args[0]);
        if (!otherGuild) return msg.channel.sendErrorMessage('Guild not found.');
        if ((guildConfig.linkedChannels.length > 1 && !guildConfig.premium) || (guildConfig.linkedChannels.length > 3 && guildConfig.premium)) return msg.channel.sendErrorMessage('You have reached the limit of linked channels in that server.');
        const botMember = otherGuild.members.get(this.delta.client.user.id);
        if (!botMember) return msg.channel.sendErrorMessage('The bot is not in the other guild.');
        const otherChannel = this.utils.resolveChannel(otherGuild, args[1]);
        if (!otherChannel || otherChannel.type !== 0) return msg.channel.sendErrorMessage('Channel not found');
        const otherGuildMember = otherGuild.members.get(msg.author.id);
        if (!otherGuildMember.permission.has('administrator') || !otherGuildMember.permission.has('manageGuild')) return msg.channel.sendErrorMessage('You have to be admin in the other guild in order to link it with that one');
        if ((!botMember.permission.has('manageWebhooks') || !otherChannel.memberHasPermission(this.delta.client.user.id, 'manageWebhooks')) && !otherChannel.memberHasPermission(this.delta.client.user.id, 'readMessages')) return msg.channel.sendErrorMessage('I need the `Manage Webhooks` and `Read Messages` permissions in the other channel.');
        const message = await msg.channel.createMessage(`${this.emotes.loading} Loading...`);
        const webhook1 = await msg.channel.createWebhook({
            name: 'Delta',
            avatar: null
        });
        const webhook2 = await otherChannel.createWebhook({
            name: 'Delta',
            avatar: null
        });
        let otherGuildDB = await this.delta.db.Guild.findOne({ID: otherGuild.id});
        if (!otherGuildDB) {
            otherGuildDB = new this.delta.db.Guild();
        }
        otherGuildDB.linkedChannels.push([webhook1.id, webhook2.id]);
        guildConfig.linkedChannels.push([webhook1.id, webhook2.id]);
        await otherGuildDB.save();
        await guildConfig.save();
        return message.edit({content: '', embed: {
            color: this.delta.constants.colors.green,
            timestamp: new Date(),
            author: {
                icon_url: msg.member.avatarURL,
                name: `${msg.author.username}#${msg.author.discriminator}`
            },
            thumbnail: {
                url: otherGuild.iconURL
            },
            title: `${this.delta.emotes.success} Successfully created link.`,
            fields: [
                {
                    name: 'Other Server',
                    value: otherGuild.name,
                    inline: true
                },
                {
                    name: 'Other Channel',
                    value: '#' + otherChannel.name,
                    inline: true
                }
            ],
            footer: {
                text: `ID: ${otherGuild.id}`
            }
        }});
    }
}
module.exports = Link;