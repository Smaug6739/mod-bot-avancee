const Command = require('../Command');

class Restart extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'restart';
        this.module = 'Bot Admin';
        this.argsRequired = false;
        this.description = 'Restart the bot';
    }

    async execute(msg) {
        await msg.channel.sendSuccessMessage('OK.');
        process.exit(1);
    }
}
module.exports = Restart;