async function runInviteCreate(delta, guild, invite) {
    const guildDB = await delta.db.Guild.findOne({ ID: guild.id });
    if (!guildDB || !guildDB.logging.channelID) return;
    if (!guildDB.logging.types.includes('Invite Created')) return;

    const logChannel = guild.channels.get(guildDB.logging.channelID);
    if (!logChannel) return;

    return logChannel.createMessage({ embed: {
        color: delta.constants.colors.main,
        author: {
            name: `${invite.inviter.username}#${invite.inviter.discriminator}`,
            icon_url: invite.inviter.avatar ? `https://cdn.discordapp.com/avatars/${invite.inviter.id}/${invite.inviter.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${invite.inviter.discriminator}.png`
        },
        title: 'Invite Created',
        fields: [
            {
                name: 'Invite',
                value: `https://discord.gg/${invite.code}`,
                inline: true
            },
            {
                name: 'Channel',
                value: invite.channel.mention ? invite.channel.mention : invite.channel.name,
                inline: true
            },
            {
                name: 'Max Uses',
                value: invite.maxUses ? invite.maxUses : 'Unlimited',
                inline: true
            }
        ],
        timestamp: new Date(invite.createdAt)
    }});
}

module.exports = runInviteCreate;