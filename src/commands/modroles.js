const Command = require('../Command');

class Modroles extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'modroles';
        this.module = 'Administration';
        this.description = 'Manage the moderators roles for the server or list the current ones';
        this.aliases = ['modrole'];
        this.argsRequired = false;
        this.usage = '(role)';
        this.examples = ['', 'Staff'];
        this.subcommands = [
            {
                name: 'add',
                execute: async (msg, args, guildConfig) => {
                    const role = this.delta.utils.resolveRole(msg.channel.guild, args[0]);
                    if (!role) {
                        return msg.channel.sendErrorMessage('Cannot find that role.');
                    }
                    if (guildConfig.modRoles.includes(role.id)) return msg.channel.sendErrorMessage('That role is already a moderator role.');
                    guildConfig.modRoles.push(role.id);
                    await guildConfig.save();
                    return msg.channel.sendSuccessMessage(` The users with the \`${role.name}\` role are now server moderators.`);
                },
                description: 'Add a moderator role',
                usage: '[role]',
                examples: ['Moderators']
            },
            {
                name: 'delete',
                execute: async (msg, args) => {
                    const role = this.delta.utils.resolveRole(msg.channel.guild, args[0]);
                    if (!role) {
                        return msg.channel.sendErrorMessage('Cannot find that role.');
                    }
                    const guild = await this.delta.db.Guild.findOne({ID: msg.channel.guild.id});
                    if (!guild.modRoles.includes(role.id)) return msg.channel.sendErrorMessage('That role is not a moderator role.');
                    const index = guild.modRoles.indexOf(role.id);
                    guild.modRoles.splice(index, 1);
                    await guild.save();
                    return msg.channel.sendSuccessMessage(` The users with the \`${role.name}\` role are no longer server moderators.`);
                },
                description: 'Delete a moderator role',
                usage: '[role]',
                examples: ['Moderators']
            }
        ];
    }

    async execute(msg, args, guildConfig) {
        if (!args[0]) {
            if (!guildConfig.modRoles || guildConfig.modRoles.length == 0) {
                const command = await this.delta.utils.resolveCommand(msg, this.delta);
                msg.channel.sendErrorMessage(`I didn't find any moderator role in the server. You can set one using \`${command.prefix}modroles add [role]\``);
            } else {
                let modRoles = [];
                guildConfig.modRoles.forEach(async modRole => {
                    const role = msg.channel.guild.roles.get(modRole);
                    modRoles.push(role.mention);
                });
                return msg.channel.createMessage({embed: {
                    title: ':information_source: Moderator roles of the server',
                    description: modRoles.join('\n')
                }});
            }
        }
    }
}
module.exports = Modroles;