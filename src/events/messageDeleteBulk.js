async function runMessageDeleteBulk(delta, messages) {
    const date = Date.now().toString().slice(0, 10);
    const guildDB = await delta.db.Guild.findOne({ID: messages[0].channel.guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;
    if (!guildDB.logging.types.includes('Message Deleted') || guildDB.logging.ignoredChannels.includes(messages[0].channel.id) || guildDB.logging.ignoredChannels.includes(messages[0].channel.parentID)) return;
    const logChannel = messages[0].channel.guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;

    let auditLogs = await messages[0].channel.guild.getAuditLogs(1, null, 73);
    auditLogs = auditLogs.entries[0];
    const logDate = (Math.floor(auditLogs.id / 4194304) + 1420070400000).toString().slice(0, 10);
    if (date !== logDate) return;

    if (auditLogs) {
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.default,
            author: {
                name: `${auditLogs.user.username}#${auditLogs.user.discriminator}`,
                icon_url: auditLogs.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogs.user.id}/${auditLogs.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogs.user.discriminator}.png`
            },
            title: 'Messages Bulk Deleted',
            description: `**Bulk messages deleted by <@!${auditLogs.user.id}> in ${messages[0].channel.mention}, ${auditLogs.count} messages were removed.**`,
            timestamp: new Date()
        }});
    }
}

module.exports = runMessageDeleteBulk;