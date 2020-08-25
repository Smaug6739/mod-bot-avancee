async function runMessageUpdate(delta, message, oldMessage) {
    if (message.channel.type !== 0 || message.embeds.length > 0 || !oldMessage || message.author.bot) return;
    const guildDB = await delta.db.Guild.findOne({ID: message.channel.guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;
    if (!guildDB.logging.types.includes('Message Edited') || guildDB.logging.ignoredChannels.includes(message.channel.id) || guildDB.logging.ignoredChannels.includes(message.channel.parentID)) return;

    const logChannel = message.channel.guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;

    return logChannel.createMessage({ embed: {
        color: delta.constants.colors.default,
        author: {
            name: `${message.author.username}#${message.author.discriminator}`,
            icon_url: message.member.avatarURL ? message.member.avatarURL : message.member.defaultAvatarURL
        },
        title: 'Message Edited',
        description: `**${message.author.mention} edited a message in ${message.channel.mention}** [Jump to message](https://discord.com/channels/${message.channel.guild.id}/${message.channel.id}/${message.id})`,
        fields: [
            {
                name: 'Author',
                value: `${message.author.username}#${message.author.discriminator}`
            },
            {
                name: 'Old Message',
                value: oldMessage.content.length > 1024 ? oldMessage.content.substring(0, 1021) + '...' : oldMessage.content,
                inline: false
            },
            {
                name: 'New Message',
                value: message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content,
                inline: false
            }
        ],
        footer: {
            text: `ID: ${message.id}`
        },
        timestamp: new Date()
    }});
}

module.exports = runMessageUpdate;