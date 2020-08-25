const Command = require('../Command');

class Reload extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'reload';
        this.module = 'Bot Admin';
        this.aliases = ['rl'];
        this.description = 'Reload a command';
        this.usage = '[reload]';
        this.examples = ['ping'];
    }

    async execute(msg, args) {
        try {
            // eslint-disable-next-line prefer-reflect
            delete require.cache[require.resolve(`./${args}.js`)];

            const CommandClass = require(`./${args}.js`);
            this.delta.commands.delete(CommandClass.name);
            const command = new CommandClass(this.delta);
            this.delta.commands.set(command.name, command);
            msg.channel.sendSuccessMessage(` Reloaded command \`${args}\``);
        } catch (err) {
            return msg.channel.sendErrorMessage(` An error occured: \n\`\`\`js\n${err}\n\`\`\``);
        }
    }
}
module.exports = Reload;