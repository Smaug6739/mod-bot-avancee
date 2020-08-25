async function runChannelUpdate(delta, channel, oldChannel) {
    const date = Date.now().toString().slice(0, 10);
    if (channel.topic == oldChannel.topic && channel.name == oldChannel.name) return;
    const guildDB = await delta.db.Guild.findOne({ID: channel.guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;
    if (channel.type !== 0 || !guildDB.logging.types.includes('Channel Updated') || guildDB.logging.ignoredChannels.includes(channel.id) || guildDB.logging.ignoredChannels.includes(channel.parentID)) return;

    const logChannel = channel.guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;
    let auditLogs = await channel.guild.getAuditLogs(1, null, 11);
    auditLogs = auditLogs.entries;
    const auditLogEntry = auditLogs[0];

    const logDate = (Math.floor(auditLogs.id / 4194304) + 1420070400000).toString().slice(0, 10);
    if (date !== logDate) return;

    if (auditLogEntry.after.name) {
        logChannel.createMessage({ embed: {
            color: delta.constants.colors.default,
            author: {
                name: `${auditLogEntry.user.username}#${auditLogEntry.user.discriminator}`,
                icon_url: auditLogEntry.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogEntry.user.id}/${auditLogEntry.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogEntry.user.discriminator}.png`
            },
            title: 'Channel Name Changed',
            fields: [
                {
                    name: 'Old Name',
                    value: `#${oldChannel.name}`,
                    inline: true
                },
                {
                    name: 'New Name',
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

    if (logChannel && auditLogEntry.after.topic) {
        logChannel.createMessage({ embed: {
            color: delta.constants.colors.default,
            author: {
                name: `${auditLogEntry.user.username}#${auditLogEntry.user.discriminator}`,
                icon_url: auditLogEntry.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogEntry.user.id}/${auditLogEntry.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogEntry.user.discriminator}.png`
            },
            title: 'Channel Description Changed',
            fields: [
                {
                    name: 'Old Topic',
                    value: oldChannel.topic ? oldChannel.topic : 'None',
                    inline: true
                },
                {
                    name: 'New Topic',
                    value: channel.topic ? channel.topic : 'None',
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

module.exports = runChannelUpdate;