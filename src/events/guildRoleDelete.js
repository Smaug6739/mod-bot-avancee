async function runGuildRoleDelete(delta, guild, role) {
    const date = Date.now().toString().slice(0, 10);
    const guildDB = await delta.db.Guild.findOne({ID: guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;
    if (!guildDB.logging.types.includes('Role Created')) return;

    const logChannel = guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;
    let auditLogs = await guild.getAuditLogs(1, null, 32);
    auditLogs = auditLogs.entries[0];
    const logDate = (Math.floor(auditLogs.id / 4194304) + 1420070400000).toString().slice(0, 10);
    if (date !== logDate) return;

    if (auditLogs) {
        logChannel.createMessage({ embed: {
            color: delta.constants.colors.red,
            author: {
                name: `${auditLogs.user.username}#${auditLogs.user.discriminator}`,
                icon_url: auditLogs.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogs.user.id}/${auditLogs.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogs.user.discriminator}.png`
            },
            title: 'Role Deleted',
            fields: [
                {
                    name: 'Role',
                    value: role.name,
                    inline: true
                }
            ],
            footer: {
                text: `ID: ${role.id}`
            },
            timestamp: new Date(role.createdAt)
        }});
    }
}

module.exports = runGuildRoleDelete;