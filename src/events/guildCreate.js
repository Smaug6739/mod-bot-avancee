const config = require('../../config');

async function runGuildCreate(delta, guild) {
    if (guild.unavailable) {
        return;
    }
    const blacklist = await delta.db.Blacklist.findOne({ ID: guild.id, blacklisted: true }).exec();
    if (blacklist) {
        delta.client.leaveGuild(guild.id);
        delta.logger.guilds.fatal(`A blacklisted guild tried adding me. Left it. Guild ID: ${guild.id}`);
        return;
    }
    delta.logger.guilds.info(`Guild created. Name: ${guild.name}. ID: ${guild.id}`);
    const owner = guild.members.get(guild.ownerID);
    delta.client.executeWebhook(config.webhooks.guildLogs.ID, config.webhooks.guildLogs.token, {
        embeds: [{
            title: 'New Guild Added',
            timestamp: new Date(),
            color: delta.constants.colors.green,
            fields: [
                {
                    name: 'Guild',
                    value: `${guild.name} (\`${guild.id}\`)`,
                    inline: true
                },
                {
                    name: 'Owner',
                    value: `${owner.username}#${owner.discriminator} (ID: \`${owner.id}\`)`,
                    inline: true
                },
                {
                    name: 'Region',
                    value: `${guild.region}`,
                    inline: true
                },
                {
                    name: 'Members',
                    value: `${guild.memberCount}`,
                    inline: true
                },
                {
                    name: 'Large',
                    value: `${guild.large}`,
                    inline: true
                }
            ],
            thumbnail: {
                url: guild.iconURL
            },
            footer: {
                text: `${delta.client.user.username} | ID: ${delta.client.user.id}`,
                icon_url: delta.client.user.avatarURL
            }
        }]
    });
}

module.exports = runGuildCreate;