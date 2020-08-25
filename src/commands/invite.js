const Command = require('../Command');

class Invite extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'invite';
        this.module = 'Info';
        this.argsRequired = false;
        this.description = 'Get the bot\'s invite';
    }

    async execute(msg) {
        msg.channel.createMessage({
            embed: {
                color: 0x4F98FF, 
                description: `<a:cursor:640984549219762176> [Click here to invite me!](https://${this.delta.client.user.id === '618124899420209167' ? 'dev.' : ''}deltabot.tech/invite)`
            }
        });
    }
}
module.exports = Invite;