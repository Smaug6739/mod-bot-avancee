const Command = require('../Command');

class Binary extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'binary';
        this.module = 'Fun';
        this.aliases = ['bin'];
        this.usage = '[text]';
        this.description = 'Convert a given text to binary.';
        this.examples = ['baguette'];
    }

    async execute(msg, args) {
        let text = args.join(' ');
        let result = '';
        for (let i = 0; i < text.length; i++) {
            let bin = text[i].charCodeAt().toString(2);
            result += Array(8 - bin.length + 1).join('0') + bin;
        }
        return msg.channel.createMessage({ embed: {
            title: 'Binary conversion',
            description: result
        }});
    }
}
module.exports = Binary;