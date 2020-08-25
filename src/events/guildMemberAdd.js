const moment = require('moment');

async function runGuildMemberAdd(delta, guild, member) {
    const date = Date.now().toString().slice(0, 10);
    const guildDB = await delta.db.Guild.findOne({ID: guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;
    if (!guildDB.logging.types.includes('Member Joined')) return;

    if (guildDB.mute.users.find(user => user.ID == member.id) && guildDB.mute.roleID) member.addRole(guildDB.mute.roleID).catch();

    const logChannel = guild.channels.get(guildDB.logging.channelID);

    if (logChannel && !member.bot) {
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.green,
            author: {
                name: `${member.username}#${member.discriminator}`,
                icon_url: member.avatarURL ? member.avatarURL : member.defaultAvatarURL
            },
            thumbnail: {
                url: member.avatarURL ? member.avatarURL : member.defaultAvatarURL
            },
            title: 'Member Joined',
            description: member.mention,
            fields: [
                {
                    name: 'Account Created',
                    value: `${moment(member.createdAt).format('MMM D, YYYY')}\n(${moment(member.createdAt).fromNow()})`,
                    inline: true
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
            timestamp: new Date(member.joinedAt)
        }});
    }
    if (logChannel && member.bot) {
        const logDate = (Math.floor(auditLogs.id / 4194304) + 1420070400000).toString().slice(0, 10);
        if (date !== logDate) return;
        
        let auditLogs = await guild.getAuditLogs(1, null, 28);
        auditLogs = auditLogs.entries;
        const auditLogEntry = auditLogs[0];
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.green,
            author: {
                name: `${auditLogEntry.user.username}#${auditLogEntry.user.discriminator}`,
                icon_url: auditLogEntry.user.avatarURL ? auditLogEntry.user.avatarURL : auditLogEntry.user.defaultAvatarURL
            },
            thumbnail: {
                url: member.avatarURL ? member.avatarURL : member.defaultAvatarURL
            },
            title: 'Bot Added',
            description: member.mention,
            fields: [
                {
                    name: 'Account Created',
                    value: `${moment(member.createdAt).format('MMM D, YYYY')}\n(${moment(member.createdAt).fromNow()})`,
                    inline: true
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
            timestamp: new Date(member.joinedAt)
        }});
    }
}

module.exports = runGuildMemberAdd;