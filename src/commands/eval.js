const util = require('util');
const Command = require('../Command');

class Eval extends Command {
    constructor(delta) {
        super(delta);

        this.name = 'eval';
        this.aliases = ['e'];
        this.module = 'Bot Owner';
        this.description = 'Evaluate JavaScript code';
        this.usage = '[js]';
        this.examples = ['1+1'];
    }

    // eslint-disable-next-line no-unused-vars
    async execute(msg, args, guildConfig) {
        let evaled;
        try {
            evaled = await eval(args.join(' ').trim());
            if (args[0] === '-a' || args[0] === '-async') {
                args.shift();
                evaled = `(async () => { ${args.join(' ').trim()} })()`;
            }
            if (typeof evaled === 'object') {
                evaled = util.inspect(evaled, { depth: 0, showHidden: true });
            } else {
                evaled = String(evaled);
            }
        } catch (err) {
            return msg.channel.createMessage(`\`\`\`js\n${err}\`\`\``);
        }

        evaled = evaled.replace(this.delta.client.token, 'no.');

        const fullLen = evaled.length;

        if (fullLen === 0) {
            return null;
        }

        if (fullLen > 2000) {
            evaled = evaled.match(/[\s\S]{1,1900}[\n\r]/g) || [];
            if (evaled.length > 3) {
                msg.channel.createMessage(`\`\`\`js\n${evaled[0]}\`\`\``);
                msg.channel.createMessage(`\`\`\`js\n${evaled[1]}\`\`\``);
                msg.channel.createMessage(`\`\`\`js\n${evaled[2]}\`\`\``);
                return;
            }
            return evaled.forEach((message) => {
                msg.channel.createMessage(`\`\`\`js\n${message}\`\`\``);
                return;
            });
        }
        return msg.channel.createMessage(`\`\`\`js\n${evaled}\`\`\``);
    }
}
module.exports = Eval;