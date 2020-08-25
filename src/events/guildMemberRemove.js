async function runGuildMemberRemove(delta, guild, member) {
    const date = Date.now().toString().slice(0, 10);
    const guildDB = await delta.db.Guild.findOne({ID: guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;

    const logChannel = guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;
    let auditLogs = await guild.getAuditLogs(1);
    auditLogs = auditLogs.entries[0];
    const logDate = (Math.floor(auditLogs.id / 4194304) + 1420070400000).toString().slice(0, 10);
    if (date !== logDate) return;
    if (auditLogs.actionType === 20 && guildDB.logging.types.includes('Member Kicked')) {
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.red,
            author: {
                name: `${auditLogs.user.username}#${auditLogs.user.discriminator}`,
                icon_url: auditLogs.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogs.user.id}/${auditLogs.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogs.user.discriminator}.png`
            },
            thumbnail: {
                url: member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${member.user.discriminator}.png`,
            },
            title: 'Member Kicked',
            fields: [
                {
                    name: 'User',
                    value: `${member.user.username}#${member.user.discriminator}`
                },
                {
                    name: 'Member Count',
                    value: guild.memberCount,
                    inline: true
                }
            ],
            footer: {
                text: `ID: ${member.id}`
            },
            timestamp: new Date()
        }});
    }
    if (guildDB.logging.types.includes('Member Banned') && auditLogs.actionType == 22) {
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.red,
            author: {
                name: `${auditLogs.user.username}#${auditLogs.user.discriminator}`,
                icon_url: auditLogs.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogs.user.id}/${auditLogs.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogs.user.discriminator}.png`
            },
            thumbnail: {
                url: member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${member.user.discriminator}.png`
            },
            title: 'Member Banned',
            fields: [
                {
                    name: 'User',
                    value: `${member.user.username}#${member.user.discriminator}`
                },
                {
                    name: 'Member Count',
                    value: guild.memberCount,
                    inline: true
                }
            ],
            footer: {
                text: `ID: ${member.user.id}`
            },
            timestamp: new Date()
        }});
    }
    if (guildDB.logging.types.includes('Member Left') && auditLogs.actionType !== 20 && auditLogs.actionType !== 22) {
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.red,
            author: {
                name: `${member.user.username}#${member.user.discriminator}`,
                icon_url: member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${member.user.discriminator}.png`
            },
            thumbnail: {
                url: member.user.avatar ? `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${member.user.discriminator}.png`
            },
            title: 'Member Left',
            fields: [
                {
                    name: 'Member Count',
                    value: guild.memberCount,
                    inline: true
                }
            ],
            footer: {
                text: `ID: ${member.id}`
            },
            timestamp: new Date()
        }});
    }
}

module.exports = runGuildMemberRemove;