const Command = require('../Command');
const colors = require('../constants/colors');

class Vote extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'vote';
        this.module = 'Info';
        this.argsRequired = false;
        this.description = 'Get the link to vote on DBL';
    }

    async execute(msg) {
        msg.channel.createMessage({
            embed: {
                title: 'DBL Vote',
                color: colors.main,
                timestamp: new Date(msg.createdAt),
                description: 'Join our support server to recieve rewards for voting!',
                author: {
                    name: this.delta.client.user.username,
                    icon_url: this.delta.client.user.avatarURL
                },
                fields: [
                    {
                        name: 'DBL Page',
                        value: '[Click here](https://deltabot.tech/dbl)',
                        inline: true
                    },
                    {
                        name: 'Support Server',
                        value: '[Click here](https://deltabot.tech/discord)',
                        inline: true
                    },
                ],
                footer: {
                    text: `${this.delta.client.user.username} | ID: ${this.delta.client.user.id}`,
                    icon_url: this.delta.client.user.avatarURL
                }
            }
        });
    }
}
module.exports = Vote;