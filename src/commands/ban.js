const Command = require('../Command');
const util = require('util');
const sleep = util.promisify(setTimeout);
const ReactionHandler = require('../extensions/ReactionHandler');

class Ban extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'ban';
        this.module = 'Moderation';
        this.permissions = ['banMembers'];
        this.cooldown = 5;
        this.description = 'Ban a user from the server';
        this.usage = '[user] (reason)';
        this.examples = ['Hector', 'Hector spamming'];
        this.subcommands = [
            {
                name: 'mass',
                execute: async (msg, args, guildConfig) => {
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
                },
                description: 'Mass ban up to 30 users',
                usage: '[user ID] [user ID] [user ID] ... | (reason)',
                examples: ['1234 5678 91011']
            },
            {
                name: 'match',
                execute: async (msg, args, guildConfig) => {
                    if (!msg.member.permission.has('manageGuild' || 'administrator')) return;
                    let query;
                    let reason = 'No reason provided';
                    if (args.includes('|')) {
                        const splitReason = args.join(' ').split(' | ');
                        if (splitReason[1]) reason = splitReason[1];
                        query = splitReason[0];
                    } else {
                        query = args.join(' ');
                    }
                    reason = encodeURIComponent(reason);

                    const msgs = await msg.channel.getMessages(100);

                    let messge = await msg.channel.createMessage(`${this.delta.emotes.loading} Searching for messages matching \`${query}\`...`);
                    const messages = msgs.filter(m => m.content == query && this.utils.checkMod(msg.channel.guild, m.member).then(a => !a) && m.author.id !== this.delta.client.user.id && m.author.id !== this.delta.owner.id);
                    if (!messages || messages.length === 0) return messge.edit(`${this.delta.emotes.error} No messages found.`);
                    const ids = messages.map(m => m.author.id);

                    const users = [];
                    for (const id of ids) {
                        let add = true;
                        let user = await this.delta.utils.resolveMember(msg.channel.guild, id);
                        if (users.includes(id)) add = false;
                        if (!user && id.match(/^\d+$/)) {
                            user = await this.delta.client.getRESTUser(id).catch(() => {
                                add = false;
                            });
                        }
                        if (!user) add = false;
                        if (add && user.joinedAt) {
                            if (user.permission.has('administrator') || user.permission.has('manageGuild')) {
                                add = false;
                            }
                        }
                        if (add) users.push(user.id);
                    }

                    if (users.length === 0) return msg.channel.createMessage(`${this.delta.emotes.error} Users not found.`);

                    messge.edit({ content: `<:DiscordTools:640985652606795776> You are going to ban **${users.length}** user(s). Please confirm that action by reacting with ${this.delta.emotes.success} to ban the users or with ${this.delta.emotes.error} to cancel.` });
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
                            await messge.removeReactions();
                            return messge.edit({ content: `${this.delta.emotes.success} Canceled.` });
                        }
                        await messge.removeReactions();
                        let usersList = [];
                        let success = 0;
                        let errored = 0;
                        const descrip = `${this.delta.emotes.loading} Massbanning...`;
                        messge.edit({ content: descrip });
                        for (const user of users) {
                            try {
                                let usr = await this.delta.utils.resolveMember(msg.channel.guild, user);
                                msg.delete();
                                await this.delta.utils.banUser(delta, msg, usr, reason, 'massban');
                                success++;
                                messge.edit(`${descrip} (${success}/${users.length})`);
                                usersList.push(`${usr.username}#${usr.discriminator}`);
                                await sleep(1000);
                            } catch (e) {
                                errored++;
                            }
                        }
                        let desc = success > 0 ? `**Banned** \`${success}\` members` : 'Failed to ban any members';
                        if (errored > 0 && desc !== '**Failed** to ban any members') desc += `\nFailed to ban \`${errored}\` members`;
                        if (desc !== 'Failed to ban any members') desc += `\n**Out** of \`${ids.length}\` members`;
                        messge.edit({
                            content: '',
                            embed: {
                                title: `${this.delta.emotes.success} Massbanned Users`,
                                color: this.delta.constants.colors.green,
                                description: desc,
                                timestamp: new Date(),
                                fields: [
                                    {
                                        name: 'Banned users',
                                        value: `\`\`\`\n${usersList.join('\n')}\`\`\``
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
                                    description: desc,
                                    timestamp: new Date(),
                                    fields: [
                                        {
                                            name: 'Banned users',
                                            value: `\`\`\`\n${usersList.join('\n')}\`\`\``
                                        }
                                    ]
                                }
                            });
                        }
                    });
                },
                description: 'Ban the users who sent a specific message in the last 100 messages',
                usage: '[text] | (reason)',
                examples: ['Join my server at https://discord.gg/weEpVS9']
            }
        ];
    }

    async execute(msg, args) {
        let user = this.delta.utils.resolveMember(msg.channel.guild, args[0]);
        if (!user) {
            let rUser = await this.delta.client.getRESTUser(args[0]).catch(() => msg.channel.sendErrorMessage('User not found.'));
            user = rUser;
        }
        const isMod = await this.delta.utils.checkMod(msg.channel.guild, user);
        if (isMod) {
            return msg.channel.sendErrorMessage('That user is a server moderator/manager, I can\'t do that.');
        }
        if (user.id === msg.member.id) {
            return msg.channel.sendErrorMessage('Nice try. You can\'t ban yourself, sorry.');
        }
        let reason = args[1] ? args.splice(0, 1).join(' ') : 'No reason provided';
        return msg.channel.createMessage(await this.delta.utils.banUser(this.delta, msg.member, user, reason, 'ban')).catch(() => msg.channel.sendErrorMessage('I couldn\'t ban that user, they probably have higher roles than me.'));
    }
}
module.exports = Ban;