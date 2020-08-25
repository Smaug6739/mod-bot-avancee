const Command = require('../Command');

function validPrefix (input) {
    const spaceReg = / $/;
    let backReg = /\\/;
    if (backReg.test(input)) {
        return { bool: true,
            reason: 'Prefix contains backslash' };
    }
    if (spaceReg.test(input) && input.length > 6) {
        return { bool: true,
            reason: 'Prefix is too long, with space' };
    }
    if (!spaceReg.test(input) && input.length > 5) {
        return { bool: true,
            reason: 'Prefix is too long, without space' };
    }
    return { bool: false,
        reason: 'Prefix is perfect' };
}

class Prefix extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'prefix';
        this.module = 'Administration';
        this.argsRequired = false;
        this.description = 'Change the bot\'s prefix in the server or get the current prefix.';
        this.usage = '(prefix)';
        this.examples = ['', 'Δ'];
    }
    
    async execute(msg, args) {
        if (!args.length || !args[0]) {
            return msg.channel.createMessage(`The prefix for **${msg.channel.guild.name}** is: \`${this.delta.prefix}\`.`);
        }
        let pfx = args.join(' ').replace(/{space}$/, ' ');
        let valid = validPrefix(pfx);
        if (valid.bool === true) {
            return msg.channel.createMessage({
                embed: {
                    title: 'Invalid Prefix',
                    fields: [
                        {
                            name: 'Not allowed',
                            value: 'Length > 5 with no space at the end is not allowed\nAny prefix with a backslash (`\\`) is not allowed'
                        },
                        {
                            name: 'Reason',
                            value: valid.reason
                        }
                    ],
                    color: this.delta.constants.colors.red
                }
            });
        }
        if (pfx == this.delta.prefix) await this.delta.db.Guild.updateOne({ ID: msg.channel.guild.id }, { $unset: { prefix: pfx } });
        await this.delta.db.Guild.updateOne({ ID: msg.channel.guild.id }, { $set: { prefix: pfx } });
        return msg.channel.sendSuccessMessage(`Updated your guild prefix to \`${pfx}\``);
    }
}
module.exports = Prefix;
