async function runGuildBanRemove(delta, guild, user) {
    const guildDB = await delta.db.Guild.findOne({ID: guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;
    if (!guildDB.logging.types.includes('Member Unbanned')) return;

    const logChannel = guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;
    return logChannel.createMessage({ embed: {
        color: delta.constants.colors.green,
        thumbnail: {
            url: user.avatarURL ? user.avatarURL : user.defaultAvatarURL
        },
        title: 'Member Unbanned',
        fields: [
            {
                name: 'User',
                value: `${user.username}#${user.discriminator}`,
                inline: true
            }
        ],
        footer: {
            text: `ID: ${user.id}`
        },
        timestamp: new Date()
    }});
}

module.exports = runGuildBanRemove;