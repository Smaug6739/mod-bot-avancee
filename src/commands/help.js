const Command = require('../Command');

class Help extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'help';
        this.module = 'Info';
        this.argsRequired = false;
        this.aliases = ['commands'];
        this.description = 'Get information about the bot\'s commands';
        this.usage = '(command)';
        this.examples = ['', 'ping'];
    }

    async execute(msg, args) {
        const cmd = await this.utils.resolveCommand(msg, this.delta);
        if (!args[0]) {

            const allCommands = this.delta.commands.map(c => c);
            const commArray = allCommands.filter(c => c.module !== 'Bot Admin' && c.module !== 'Bot Owner');
            let modules = [];
            // get list off all modules
            for (const command of commArray) {
                modules.push(command.module);
            }

            // refine list to 1 of each module
            modules = [...new Set(modules)];

            // create new array for each module
            for (const mods of modules) {
                this[mods] = [];
            }

            // push commands to its rightful array
            for (const cmds of commArray) {
                this[cmds.module].push(`**${cmd.prefix}${cmds.name}** - ${cmds.description}`);
            }

            const embed = {
                title: '<:Delta:709325663269814293> Commands List',
                color: 0x4F98FF,
                timestamp: new Date(msg.createdAt),
                fields: [],
                footer: {
                    text: `Bot ID: ${this.delta.client.user.id} | Server ID: ${msg.channel.guild.id}`,
                    icon_url: this.delta.client.user.avatarURL
                }
            };

            // push module fields to emebed
            modules.forEach(module => {
                embed.fields.push({
                    name: `(${this[module].length}) __${module}:__`,
                    value: this[module].join('\n'),
                    inline: false
                });
            });

            // push last fields to embed
            embed.fields.push(
                {
                    name: '\u200b',
                    value: `Use \`${cmd.prefix}help [command]\` to get more infos about a command.`,
                    inline: false,
                },
                {
                    name: '\u200B',
                    value: '*Need help? Join our [Support Server](https://deltabot.tech/discord)*',
                    inline: false
                }
            );

            msg.channel.createEmbed(embed);
        }
        if (args[0] && !args[1]) {
            const command = this.delta.commands.get(args[0].toLowerCase()) || Array.from(this.delta.commands.values()).find(command => command.aliases && command.aliases.includes(args[0].toLowerCase()));
            if (!command) {
                return this.delta.client.createMessage(msg.channel.id, `${this.emotes.error} Command not found, use \`${cmd.prefix}help\` to get a list of commands.`);
            }
            this.utils.sendCommandHelp(msg, command, cmd.prefix);
        }
        if (args[1]) {
            const command = this.delta.commands.get(args[0].toLowerCase()) || this.delta.commands.find(c => c.aliases && c.aliases.includes(args[0].toLowerCase()));
            if (!command) return this.delta.client.createMessage(msg.channel.id, `${this.emotes.error} Command not found, use \`${cmd.prefix}help\` to get a list of commands.`);
            const subcommand = command.subcommands.find(sub => sub.name && sub.name.includes(args[1].toLowerCase()));
            if (!subcommand) return msg.channel.sendErrorMessage(` Cannot find that subcommand. Try \`${cmd.prefix}help\` to get a list of commands.`);
            this.utils.sendSubcommandHelp(msg, command, subcommand, cmd.prefix);
        }
    }
}
module.exports = Help;