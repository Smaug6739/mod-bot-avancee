async function runChannelDelete(delta, channel) {
    const date = Date.now().toString().slice(0, 10);
    const guildDB = await delta.db.Guild.findOne({ID: channel.guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;
    if (channel.type !== 0 || !guildDB.logging.types.includes('Channel Deleted') || guildDB.logging.ignoredChannels.includes(channel.parentID)) return;

    const logChannel = channel.guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;
    let auditLogs = await channel.guild.getAuditLogs(1, null, 12);
    auditLogs = auditLogs.entries;
    const auditLogEntry = auditLogs[0];

    const logDate = (Math.floor(auditLogs.id / 4194304) + 1420070400000).toString().slice(0, 10);
    if (date !== logDate) return;

    if (auditLogEntry) {
        logChannel.createMessage({ embed: {
            color: delta.constants.colors.red,
            author: {
                name: `${auditLogEntry.user.username}#${auditLogEntry.user.discriminator}`,
                icon_url: auditLogEntry.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogEntry.user.id}/${auditLogEntry.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogEntry.user.discriminator}.png`
            },
            title: 'Channel Deleted',
            fields: [
                {
                    name: 'Channel',
                    value: `#${channel.name}`,
                    inline: true
                }
            ],
            footer: {
                text: `ID: ${channel.id}`
            },
            timestamp: new Date(channel.createdAt)
        }});
    }
}

module.exports = runChannelDelete;