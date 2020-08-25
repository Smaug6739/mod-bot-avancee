const Command = require('../Command');
const EmbedPaginator = require('../extensions/EmbedPagination');

class Reactionroles extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'reactionroles';
        this.module = 'Administration';
        this.cooldown = 5;
        this.aliases = ['rr'];
        this.permissions = ['manageRoles', 'manageMessages', 'addReactions'];
        this.description = 'Manage the reaction roles of the server';
        this.argsRequired = false;
        this.vip = true;
        this.subcommands = [
            {
                name: 'add',
                execute: async (msg, args) => {
                    const guild = await delta.db.Guild.findOne({ ID: msg.channel.guild.id });
                    if ((guild.reactionRoles.length > 3 && !guild.premium) || (guild.reactionRoles.length > 7 && guild.premium)) return msg.channel.sendErrorMessage('You have reached the limit of reaction roles in that server.');

                    const channel = delta.utils.resolveChannel(msg.channel.guild, args[0]);
                    if (!channel) return msg.channel.createMessage(`${delta.emotes.error} Cannot find that channel.`);
                    const message = await channel.getMessage(args[1].trim());
                    if (!message) return msg.channel.createMessage(`${delta.emotes.error} Cannot find that message.`);
                    let emote = await delta.utils.resolveGuildEmoji(msg.channel.guild, args[2].trim());
                    if (!emote && delta.utils.isUnicode(args[2])) emote = args[2];
                    if (!emote) return msg.channel.createMessage(`${delta.emotes.error} Cannot find that emote.`);
                    args.splice(0, 3);
                    const role = delta.utils.resolveRole(msg.channel.guild, args.join(' '));
                    if (!role || role.id == msg.channel.guild.id) return msg.channel.createMessage(`${delta.emotes.error} Cannot find that role.`);

                    const existingReactionRole = guild.reactionRoles.find(r => r.emoji == emote && r.messageID == message.id);
                    if (existingReactionRole) return msg.channel.createMessage(`${delta.emotes.error} There is already an existing reaction role with that emote for that message.`);
                    await message.addReaction(emote.id ? `${emote.name}:${emote.id}` : emote);
                    await delta.db.Guild.updateOne({ ID: msg.channel.guild.id }, { $addToSet: { reactionRoles: [{channelID: channel.id, messageID: message.id, emoji: emote.id ? emote.id : emote, roleID: role.id }]}});
                    await delta.utils.listenToReactionRole(delta, message, emote, role);
                    msg.channel.sendSuccessMessage('Sucessfully created reaction role.');
                    const newGuild = await delta.db.Guild.findOne({ ID: msg.channel.guild.id });
                    let dbRole = newGuild.reactionRoles.find(a => a.messageID == message.id && (a.emoji == emote.id || a.emoji == emote));
                    if (!newGuild.reactionRoles.length < 0) return msg.channel.sendErrorMessage('An error occured while creating reaction roles, please report it to the developers.');
                    let embed = { color: delta.constants.colors.green, title: `${delta.emotes.success} Reaction Role Created`, fields: [] };
                    const canal = msg.channel.guild.channels.get(dbRole.channelID);
                    embed.fields.push({ name: 'Channel', value: canal.mention, inline: true });
                    const messge = canal.getMessage(dbRole.messageID);
                    embed.fields.push({ name: 'Message', value: `[Jump to message](https://discordapp.com/channels/${msg.channel.guild.id}/${canal.id}/${messge.id})`, inline: true});
                    let emoji = await delta.utils.resolveGuildEmoji(msg.channel.guild, dbRole.emoji);
                    if (!emoji.id && !this.isUnicode(emoji)) emoji = await this.resolveGuildEmoji(message.channel.guild, emoji);
                    embed.fields.push({ name: 'Emoji', value: emoji ? `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>` : dbRole.emoji, inline: true});
                    const rol = msg.channel.guild.roles.get(dbRole.roleID);
                    embed.fields.push({ name: 'Role', value: rol.mention, inline: true });
                    return msg.channel.createMessage({ embed });
                },
                description: 'Add a reaction role',
                aliases: ['add'],
                argsRequired: true,
                usage: '[channel] [message ID] [emoji] [role]',
                examples: [`#info 633382988867960872 ${delta.emotes.success} Verified`]
            },
            {
                name: 'remove',
                execute: async(msg, args) => {
                    const guild = await delta.db.Guild.findOne({ ID: msg.channel.guild.id });
                    if (args.length == 1 && args[0] == 'all') {
                        guild.reactionRoles.splice(0, guild.reactionRoles.length);
                        guild.save();
                        return msg.channel.sendSuccessMessage('Successfully removed all the reaction roles of the server.');
                    }
                    const channel = delta.utils.resolveChannel(msg.channel.guild, args[0]);
                    if (!channel) return msg.channel.sendErrorMessage('Cannot find that channel.');
                    const message = await channel.getMessage(args[1]);
                    if (!message) return msg.channel.sendErrorMessage('Cannot find that message.');
                    if (!guild.reactionRoles.find(r => r.messageID === message.id)) return msg.channel.createMessage(`${delta.emotes.error} There isn't any reaction role for that message.`);
                    await message.removeReactions();
                    await delta.db.Guild.updateOne({ ID: msg.channel.guild.id }, { $pull: {messageID: message.id} });
                    return msg.channel.createMessage(`${this.delta.emotes.success} Successfully removed reaction roles for that message.`);
                },
                aliases: ['delete'],
                argsRequired: true,
                description: 'Delete a reaction role. Use the `all` option to remove all the reaction roles',
                usage: '[channel] [message ID] [emoji] [role]',
                examples: [`#info 633382988867960872 ${delta.emotes.success} Verified`]
            },
            {
                name: 'list',
                execute: async(msg) => {
                    const guildDB = await delta.db.Guild.findOne({ID: msg.channel.guild.id });
                    const command = await delta.utils.resolveCommand(msg, delta);
                    if (guildDB.reactionRoles.length == 0) return msg.channel.sendErrorMessage(`There is no reaction role in that server yet, run \`${command.prefix}help reactionroles add\` to get information about creating a reaction role.`);
                    const embeds = [];
                    guildDB.reactionRoles.forEach(reactionRole => {
                        embeds.push({
                            color: delta.constants.colors.main,
                            title: `Reaction Roles for **${msg.channel.guild.name}**`,
                            fields: [
                                {
                                    name: 'Channel',
                                    value: msg.channel.guild.channels.get(reactionRole.channelID).mention,
                                    inline: true
                                },
                                {
                                    name: 'Message',
                                    value: `[Jump to Message](https://discord.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`,
                                    inline: true
                                },
                                {
                                    name: 'Emoji',
                                    value: reactionRole.emoji.id ? `<:${reactionRole.emoji.name}:${reactionRole.emoji.id}>` : reactionRole.emoji,
                                    inline: true
                                },
                                {
                                    name: 'Role',
                                    value: msg.channel.guild.roles.get(reactionRole.roleID).mention,
                                    inline: true
                                }
                            ]
                        });
                    });
                    if (embeds.length == 1) {
                        let embed = embeds[0];
                        return msg.channel.createMessage({ embed });
                    }
                    return EmbedPaginator.createPaginationEmbed(msg, embeds);
                },
                description: 'List the reaction roles of the server'
            }
        ];
    }
}
module.exports = Reactionroles;