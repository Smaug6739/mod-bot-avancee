const config = require('../../config');

function runDisconnect(delta, err) {
    if (err) console.log(err);
    return delta.client.executeWebhook(config.webhooks.readyLogs.ID, config.webhooks.readyLogs.token, {
        embeds: [{
            title: 'Disconnecting from Discord...',
            thumbnail: {
                url: delta.client.user.avatarURL
            },
            timestamp: new Date(),
            color: 16711680,
            description: `Error:\n\`\`\`${err}\n\`\`\``,
            footer: {
                icon_url: delta.client.user.avatarURL,
                text: `${delta.client.user.username} | Bot ID: ${delta.client.user.id}`
            }
        }
        ]});
}

module.exports = runDisconnect;