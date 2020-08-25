const Command = require('../Command');

class Ping extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'ping';
        this.module = 'Info';
        this.argsRequired = false;
        this.description = 'Ping the bot';
    }

    async execute(msg) {
        const then = Date.now();
        const newmsg = await msg.channel.createMessage('Pong!');
        const diff = Date.now() - then;
        await newmsg.edit(`Pong! \`${diff}ms\``);
    }
}
module.exports = Ping;