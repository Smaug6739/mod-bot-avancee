async function runMessageDelete(delta, message) {
    const date = Date.now().toString().slice(0, 10);
    if (message.channel.type !== 0) return;
    const guildDB = await delta.db.Guild.findOne({ID: message.channel.guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;
    if (!guildDB.logging.types.includes('Message Deleted') || guildDB.logging.ignoredChannels.includes(message.channel.id) || guildDB.logging.ignoredChannels.includes(message.channel.parentID)) return;
    const logChannel = message.channel.guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;

    if (!message.author) {
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.red,
            description: `Message deleted in ${message.channel.mention}`,
            timestamp: new Date()
        }
        });
    }

    if (message.embeds.length > 0 || message.author.bot) return;
    let auditLogs = await message.channel.guild.getAuditLogs(1);
    auditLogs = auditLogs.entries[0];
    const logDate = (Math.floor(auditLogs.id / 4194304) + 1420070400000).toString().slice(0, 10);
    if (date !== logDate) return;

    if (auditLogs.actionType == 72) {
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.red,
            author: {
                name: `${auditLogs.user.username}#${auditLogs.user.discriminator}`,
                icon_url: auditLogs.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogs.user.id}/${auditLogs.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogs.user.discriminator}.png`
            },
            title: 'Message Deleted',
            description: `**Message deleted by <@!${auditLogs.user.id}> in ${message.channel.mention}**`,
            fields: [
                {
                    name: 'Author',
                    value: `${message.author.username}#${message.author.discriminator}`
                },
                {
                    name: 'Content',
                    value: message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content
                }
            ],
            image: message.attachments.length > 0 ? message.attachments[0].url : null,
            footer: {
                text: `ID: ${message.id}`
            },
            timestamp: new Date()
        }});
    }

    if (!auditLogs) {
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.red,
            author: {
                name: `${message.member.username}#${message.member.discriminator}`,
                icon_url: message.member.avatarURL ? message.member.avatarURL : message.member.avatarURL
            },
            title: 'Message Deleted',
            description: `**Message deleted by ${message.member.mention} in ${message.channel.mention}**`,
            fields: [
                {
                    name: 'Author',
                    value: `${message.author.username}#${message.author.discriminator}`
                },
                {
                    name: 'Content',
                    value: message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content
                }
            ],
            image: message.attachments.length > 0 ? message.attachments[0].url : null,
            footer: {
                text: `ID: ${message.id}`
            },
            timestamp: new Date()
        }});
    }
}

module.exports = runMessageDelete;