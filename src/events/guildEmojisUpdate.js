// eslint-disable-next-line no-unused-vars
async function runGuildEmojisUpdate(delta, guild, emojis, oldEmojis) {
    const date = Date.now().toString().slice(0, 10);
    const guildDB = await delta.db.Guild.findOne({ID: guild.id});
    if (!guildDB || !guildDB.logging.channelID) return;
    if (!guildDB.logging.types.includes('Emoji Created')) return;

    const logChannel = guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;
    let auditLogs = await guild.getAuditLogs(1);
    auditLogs = auditLogs.entries[0];

    const logDate = (Math.floor(auditLogs.id / 4194304) + 1420070400000).toString().slice(0, 10);
    if (date !== logDate) return;

    if (auditLogs && auditLogs.actionType == 60) {
        const emoji = guild.emojis.find(emote => emote.id == auditLogs.targetID);

        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.green,
            author: {
                name: `${auditLogs.user.username}#${auditLogs.user.discriminator}`,
                icon_url: auditLogs.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogs.user.id}/${auditLogs.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogs.user.discriminator}.png`
            },
            thumbnail: {
                url: `https://cdn.discordapp.com/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}`
            },
            title: 'Emoji Created',
            fields: [
                {
                    name: 'Emoji',
                    value: `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`,
                    inline: true
                }
            ],
            footer: {
                text: `ID: ${emoji.id}`
            },
            timestamp: new Date()
        }});
    }
    if (auditLogs && auditLogs.actionType == 62) {
        return logChannel.createMessage({ embed: {
            color: delta.constants.colors.red,
            author: {
                name: `${auditLogs.user.username}#${auditLogs.user.discriminator}`,
                icon_url: auditLogs.user.avatar ? `https://cdn.discordapp.com/avatars/${auditLogs.user.id}/${auditLogs.user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${auditLogs.user.discriminator}.png`
            },
            title: 'Emoji Deleted',
            fields: [
                {
                    name: 'Name',
                    value: auditLogs.before.name,
                    inline: true
                }
            ],
            timestamp: new Date()
        }});
    }
}

module.exports = runGuildEmojisUpdate;