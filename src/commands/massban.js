const Command = require('../Command');
const ReactionHandler = require('../extensions/ReactionHandler');

class Massban extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'massban';
        this.module = 'Moderation';
        this.usage = '[user ID] [user ID] [user ID] ... | (reason)';
        this.description = 'Mass ban up to 30 users';
        this.examples = ['1234 5678 91011'];
    }

    async execute(msg, args, guildConfig) {
        if (!msg.member.permission.has('administrator') && !msg.member.permission.has('manageGuild')) return;
        const messge = await msg.channel.createMessage(`${this.delta.emotes.loading} Fetching users...`);
        args = args.join(' ');
        args = args.replace('\n', '');
        args = args.split(' | ');
        const ids = args[0].split(' ');
        const reason = args[1] || 'No reason provided.';

        const bannableID = [];
        const unfoundID = [];
        const bannableTag = [];
        const unbannableTag = [];
        for (const id of ids) {
            const member = this.delta.utils.resolveMember(msg.channel.guild, id);
            if (member) {
                const isMod = await this.delta.utils.checkMod(msg.channel.guild, id);
                if (member.bannable && (!isMod || !member.id == this.delta.owner.id || !member.id == this.delta.client.user.id)) {
                    bannableID.push(id);
                    bannableTag.push(`<@${id}>`);
                }
                else unbannableTag.push(`<@${id}>`);
            }
            if (!member && id.match(/^\d+$/)) {
                const restUser = await this.delta.client.getRESTUser(id).catch(() => {
                    unfoundID.push(id);
                });
                if (restUser) {
                    bannableID.push(id);
                    bannableTag.push(`<@${id}>`);
                }
            }

        }

        const embed = {
            title: 'Ban Manager',
            color: this.delta.constants.colors.main,
            timestamp: new Date(msg.createdAt),
            author: {
                name: this.delta.client.user.username,
                icon_url: this.delta.client.user.avatarURL
            },
            fields: []
        };
        

        // fail safe for embed values
        if (unfoundID.length !== 0) embed.fields.push({ name: '**Unfound IDs:**', value: unfoundID.join('\n'), inline: false});
        if (unbannableTag.length !== 0) embed.fields.push({ name: '**Unbannable Users:**', value: unbannableTag.join('\n'), inline: false});
        if (bannableTag.length !== 0) embed.fields.push({ name: '**Banning Users:**', value: bannableTag.join('\n'), inline: false});

        messge.edit({embed, content: ''});

        if (bannableID.length === 0) return;

        this.delta.utils.createReactionMenu(messge, this.delta);
        // eslint-disable-next-line new-cap
        const reactionListener = new ReactionHandler.continuousReactionStream(
            messge,
            (userID) => userID == msg.author.id,
            false,
            { maxMatches: 1, time: 10000 }
        );
        reactionListener.on('reacted', async (event) => {
            if (event.userID !== msg.author.id) return;
            if (event.userID == this.delta.client.user.id) return;
            if (event.emoji.id == this.delta.emotes.error.replace('<', '').replace('>', '').replace('a:', '').split(':')[1]) {
                messge.removeReactions();
                return messge.edit({ content: `${this.delta.emotes.error} Massban canceled.`, embed: '' });
            }
            messge.removeReactions();


            messge.edit({ content: `${this.delta.emotes.loading} Massbanning...`, embed: '' });
            for (const id of bannableID) {
                msg.delete();
                await msg.channel.guild.banMember(id, 7, reason);
                messge.edit({
                    content: '',
                    embed: {
                        title: 'Massban',
                        color: this.delta.constants.colors.green,
                        timestamp: new Date(),
                        fields: [
                            {
                                name: `${this.delta.emotes.success} **Banned Users:**`,
                                value: bannableTag.join('\n')
                            }
                        ]
                    }
                });
                if (guildConfig.modLogChannel) {
                    let logChannel = msg.channel.guild.channels.get(guildConfig.modLogChannel);
                    return logChannel.createMessage({
                        embed: {
                            author: {
                                name: `${msg.author.username}#${msg.author.discriminator}`,
                                icon_url: msg.member.avatarURL ? msg.member.avatarURL : msg.member.defaultAvatarURL
                            },
                            title: 'Massban',
                            color: this.delta.constants.colors.main,
                            timestamp: new Date(),
                            fields: [
                                {
                                    name: 'Banned users',
                                    value: bannableTag.join('\n')
                                }
                            ]
                        }
                    });
                }
            }
        });
    }
}

module.exports = Massban;