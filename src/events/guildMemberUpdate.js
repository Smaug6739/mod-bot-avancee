async function runGuildMemberUpdate(delta, guild, member, oldMember) {
    const date = Date.now().toString().slice(0, 10);
    const guildDB = await delta.db.Guild.findOne({ID: guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;

    const logChannel = guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;

    let auditLogs = await guild.getAuditLogs(1);
    auditLogs = auditLogs.entries[0];

    const logDate = (Math.floor(auditLogs.id / 4194304) + 1420070400000).toString().slice(0, 10);
    if (date !== logDate) return;
    if (auditLogs.actionType === 25 && guildDB.logging.types.includes('Member Roles Changed')) {
        const removedRoles = [];
        if (auditLogs.after.$remove) {
            auditLogs.after.$remove.forEach(role => {
                removedRoles.push(`<@&${role.id}>`);
            });
        }
        const addedRoles = [];
        if (auditLogs.after.$add) {
            auditLogs.after.$add.forEach(role => {
                addedRoles.push(`<@&${role.id}>`);
            });
        }
        logChannel.createMessage({ embed: {
            color: delta.constants.colors.main,
            author: {
                name: `${auditLogs.user.username}#${auditLogs.user.discriminator}`,
                icon_url: auditLogs.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogs.user.id}/${auditLogs.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogs.user.discriminator}.png`
            },
            title: 'Member Roles Changed',
            description: `**${member.mention} was ${addedRoles.length > 0 ? `given ${addedRoles.join(', ')}` : ''} ${removedRoles.length > 0 ? `${removedRoles.length > 0 && addedRoles.length > 0 ? 'and was ' : ''} removed from ${removedRoles.join(', ')}` : ''}**`,
            fields: [
                {
                    name: 'User',
                    value: `${member.username}#${member.discriminator}`
                }
            ],
            footer: {
                text: `User ID: ${member.id}`
            },
            timestamp: new Date()
        }});
    }
    if (member.nick !== oldMember.nick && auditLogs.actionType == 24 && guildDB.logging.types.includes('Nickname Changed')) {
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.main,
            author: {
                name: `${auditLogs.user.username}#${auditLogs.user.discriminator}`,
                icon_url: auditLogs.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogs.user.id}/${auditLogs.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogs.user.discriminator}.png`
            },
            title: 'Nickname Changed',
            description: `**<@!${auditLogs.user.id}> has changed ${auditLogs.user.id !== member.id ? `the nickname of ${member.mention}` : 'their nickname'}**`,
            fields: [
                {
                    name: 'User',
                    value: `${member.username}#${member.discriminator}`
                },
                {
                    name: 'Old Nickname',
                    value: oldMember.nick ? oldMember.nick : 'None',
                    inline: true
                },
                {
                    name: 'New Nickname',
                    value: member.nick ? member.nick : 'None',
                    inline: true
                }
            ],
            footer: {
                text: `User ID: ${member.id}`
            },
            timestamp: new Date()
        }});
    }
}

module.exports = runGuildMemberUpdate;