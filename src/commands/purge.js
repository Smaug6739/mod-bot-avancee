const Command = require('../Command');

async function purgeMessages(delta, msg, count) {
    const message = await msg.channel.createMessage(`${delta.emotes.loading} Purging channel...`);
    let purge = await msg.channel.purge(count, (mes) => !mes.pinned, message.id, null, 'Delta purge');
    if (!purge || purge == 0) return message.edit({content: `${delta.emotes.error} I couldn't find any message to purge prior to 14 days.`});
    purge--;
    message.edit({content: `${delta.emotes.success} Successfully deleted **${purge}** messages.`}).then(setTimeout(() => {
        return message.delete();
    }, 3000));
}

class Purge extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'purge';
        this.module = 'Administration';
        this.permissions = ['manageMessages'];
        this.cooldown = 5;
        this.aliases = ['clear'];
        this.usage = '[count]';
        this.description = 'Delete a specified number of messages in the channel. (limit 1000)';
        this.examples = ['1000'];
    }

    async execute(msg, args) {
        let count = parseInt(args.join('').trim(), 10);
        if (!count || count > 1000 || count < 1 ) return msg.channel.sendErrorMessage('Please provide a valid count lower than 1000 messages.');
        count++;
        return purgeMessages(this.delta, msg, count);
    }
}
module.exports = Purge;