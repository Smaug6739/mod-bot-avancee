const Command = require('../Command');

class Say extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'say';
        this.module = 'Administration';
        this.cooldown = 3;
        this.usage = '(channel) [text]';
        this.description = 'Send a message with the bot';
        this.examples = ['#general Delta is talking!', 'Delta is talking'];
        this.subcommands = [
            {
                name: 'embed',
                execute: async(msg, args) => {
                    let channel = this.utils.resolveChannel(msg.channel.guild, args[0]);
                    if (channel) args.splice(0, 1);
                    if (!channel) {
                        msg.delete();
                        channel = msg.channel;
                    }
                    let text = args.join(' ');
                    if (this.delta.constants.badWords.filter(word => text.includes(word)).length > 0 && msg.author.id !== this.delta.owner.id) return msg.channel.sendErrorMessage('No bad words allowed.');
                    return channel.createMessage({embed: {
                        color: delta.constants.colors.main,
                        description: text
                    }});
                },
                description: 'Send a message with the bot in an embed',
                usage: '(channel) [text]',
                examples: ['#general Delta is talking!', 'Delta is talking']
            }
        ];
    }

    async execute(msg, args) {
        let channel = this.utils.resolveChannel(msg.channel.guild, args[0]);
        if (channel) args.splice(0, 1);
        if (!channel) {
            msg.delete();
            channel = msg.channel;
        }
        let text = args.join(' ');
        if (this.delta.constants.badWords.filter(word => text.includes(word)).length > 0 && msg.author.id !== this.delta.owner.id)  return msg.channel.sendErrorMessage('No bad words allowed.');
        return channel.createMessage(text);
    }
}
module.exports = Say;