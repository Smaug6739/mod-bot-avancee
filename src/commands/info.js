const Command = require('../Command');
const colors = require('../constants/colors');

class Info extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'info';
        this.module = 'Info';
        this.argsRequired = false;
        this.aliases = ['stats', 'information'];
        this.description = 'Get information about the bot';
    }

    async execute(msg) {
        let txt = 'Staging';
        if (this.delta.client.user.id == '534632914445664267') txt = 'Production';
        if (this.delta.client.user.id == '618124899420209167') txt = 'Development';
        msg.channel.createMessage({
            embed: {
                title: 'Bot Information',
                color: colors.main,
                timestamp: new Date(msg.createdAt),
                author: {
                    name: this.delta.client.user.username,
                    icon_url: this.delta.client.user.avatarURL
                },
                fields: [
                    {
                        name: 'Developer',
                        value: 'Hector#6704',
                        inline: true
                    },
                    {
                        name: 'Servers',
                        value: this.delta.client.guilds.size,
                        inline: true
                    },
                    {
                        name: 'Users',
                        value: this.delta.client.users.size,
                        inline: true
                    },
                    {
                        name: 'Library',
                        value: 'Eris (JavaScript)',
                        inline: true
                    },
                    {
                        name: 'Version',
                        value: require('../../package').version,
                        inline: true
                    },
                    {
                        name: 'Invite',
                        value: this.delta.client.user.id == '618124899420209167' ? '[Click here](https://deltabot.tech/invite)' : `[Click here](https://discord.com/api/oauth2/authorize?client_id=${this.delta.client.user.id}&permissions=8&scope=bot)`,
                        inline: true
                    },
                    {
                        name: 'Dashboard',
                        value: '[Click here](https://deltabot.tech)',
                        inline: true
                    },
                    {
                        name: 'Support Server',
                        value: '[Click here](https://deltabot.tech/discord)',
                        inline: true
                    },
                    {
                        name: 'Donate',
                        value: '[Click here](https://patreon.com/deltabot)',
                        inline: true
                    },
                    {
                        name: 'DBL Page',
                        value: '[Click here](https://deltabot.tech/dbl)',
                        inline: true
                    }
                ],
                footer: {
                    text: `${this.delta.client.user.username} | ${txt} | ID: ${this.delta.client.user.id}`,
                    icon_url: this.delta.client.user.avatarURL
                }
            }
        });
    }
}
module.exports = Info;