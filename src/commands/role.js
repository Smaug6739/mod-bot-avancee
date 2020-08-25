/* eslint-disable prefer-named-capture-group */
const Command = require('../Command');

class Role extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'role';
        this.module = 'Administration';
        this.cooldown = 5;
        this.permissions = ['manageRoles'];
        this.description = 'Manage the roles';
        this.usage = '[user] [roles]';
        this.examples = ['Hector Staff', 'Hector +Staff', 'Hector -Staff', 'Hector Staff, Support', 'Hector +Staff, -Support'];
        this.subcommands = [
            {
                name: 'create',
                execute: async(msg, args) => {
                    let roleName = args[0];
                    let color;
                    if (args[1] && args[1].toLowerCase() == 'random') color = '0x' + (Math.random() * 0xFFFFFF << 0).toString(16);
                    if (args[1] && (/^#([0-9A-F]{3}){1,2}$/i).test(args[1])) color = args[1];
                    if (args.length > 1 && !color) roleName = args.join(' ');
                    await msg.channel.guild.createRole({
                        name: roleName,
                        color: color ? parseInt(color.slice(1), 16) : null
                    });
                    return msg.channel.createMessage(`${delta.emotes.success} Role \`${roleName}\` created`);
                },
                description: 'Create a role',
                usage: '[name] (hex color)',
                examples: ['Delta', 'Delta #4F98FF'],
                aliases: ['add']
            },
            {
                name: 'delete',
                execute: async(msg, args) => {
                    let role = delta.utils.resolveRole(msg.channel.guild, args.join(' '));
                    if (!role) return msg.channel.createMessage(`${delta.emotes.error} Role not found`);
                    await msg.channel.guild.deleteRole(role.id);
                    return msg.channel.createMessage(`${delta.emotes.success} Role \`${role.name}\` deleted`);
                },
                description: 'Delete a role',
                usage: '[name]',
                examples: ['Member']
            }
        ];
    }

    async execute(msg, args) {
        const member = this.utils.resolveMember(msg.channel.guild, args[0]);
        if (!member) return msg.channel.sendErrorMessage('Member not found');
        const isMod = await this.utils.checkMod(msg.channel.guild, member);
        if (isMod) return msg.channel.sendErrorMessage('That user is a server admin/moderator, I can\'t do that');
        let command = await this.utils.resolveCommand(msg, this.delta);
        if (args.length < 2) return this.utils.sendCommandHelp(msg, command.command, command.prefix);
        let rolesList = args.slice(1).join(' ').split(', ');
        let rolesToAdd = [];
        let rolesToRemove = [];
        let stop = false;
        let botMember = msg.channel.guild.members.get(this.delta.client.user.id);
        await rolesList.forEach(arg => {
            let action = arg[0];
            let role;
            if (action !== '+' && action !== '-') {
                role = this.utils.resolveRole(msg.channel.guild, arg);
                if (!role) {
                    stop = true;
                    return msg.channel.sendErrorMessage(` Role \`${arg}\` not found.`);
                }
                if (botMember.highestRole.position < role.position) {
                    stop = true;
                    return msg.channel.sendErrorMessage(` I can't make changes to the role \`${role.name}\`, please check my roles positions.`);
                }
                if (member.roles.includes(role.id)) return rolesToRemove.push(role);
                return rolesToAdd.push(role);
            }
            if (action === '+') {
                role = this.utils.resolveRole(msg.channel.guild, arg.slice(1));
                if (!role) {
                    stop = true;
                    return msg.channel.sendErrorMessage(` Role \`${arg.slice(1)}\` not found.`);
                }
                if (member.roles.includes(role.id)) {
                    stop = true;
                    return msg.channel.sendErrorMessage(` You already have the role \`${role.name}\`.`);
                }
                if (botMember.highestRole.position < role.position) {
                    stop = true;
                    return msg.channel.sendErrorMessage(` I can't make changes to the role \`${role.name}\`, please check my roles positions.`);
                }
                return rolesToAdd.push(role);
            }
            if (action === '-') {
                role = this.utils.resolveRole(msg.channel.guild, arg.slice(1));
                if (!role) {
                    stop = true;
                    return msg.channel.sendErrorMessage(` Role \`${arg.slice(1)}\` not found.`);
                }
                if (!member.roles.includes(role.id)) {
                    stop = true;
                    return msg.channel.sendErrorMessage(` You don't have the role \`${role.name}\``);
                }
                if (botMember.highestRole.position < role.position) {
                    stop = true;
                    return msg.channel.sendErrorMessage(` I can't make changes to the role \`${role.name}\`, please check my roles positions.`);
                }
                return rolesToRemove.push(role);
            }
        });
        if (stop) return;
        await rolesToAdd.forEach(role => member.addRole(role.id));
        await rolesToRemove.forEach(role => member.removeRole(role.id));
        return msg.channel.sendSuccessMessage(` Changed the roles for ${member.username}#${member.discriminator}${rolesToAdd.length > 0 ? ', added `' + rolesToAdd.map(r => r.name).join('`, `') + '`': ''}${rolesToRemove.length > 0 ? ', removed `' + rolesToRemove.map(r => r.name).join('`, `') + '`': ''}`);
    }
}
module.exports = Role;