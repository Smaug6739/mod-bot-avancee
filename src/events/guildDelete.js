const config = require('../../config');

async function runGuildDelete(delta, guild) {
    const owner = guild.members.get(guild.ownerID);
    delta.client.executeWebhook(config.webhooks.guildLogs.ID, config.webhooks.guildLogs.token, {
        embeds: [{
            title: 'Guild Delete Event',
            timestamp: new Date(),
            color: 16711680,
            fields: [
                {
                    name: 'Guild',
                    value: `${guild.name} (\`${guild.id}\`)`,
                    inline: true
                },
                {
                    name: 'Owner',
                    value: `${owner.username}#${owner.discriminator} (\`${owner.id}\`)`,
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
    return delta.logger.guilds.info(`Guild deleted. Name: ${guild.name}. ID: ${guild.id}`);
}

module.exports = runGuildDelete;