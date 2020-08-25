const Command = require('../Command');

const notablePermissions = { kickMembers: 'Kick Members', banMembers: 'Ban Members', administrator: 'Administrator', mentionEveryone: 'Mention Everyone', manageGuild: 'Manage Guild', manageChannels: 'Manage Channels', manageRoles: 'Manage Roles', manageMessages: 'Manage Messages', manageEmojis: 'Manage Emojis', manageWebhooks: 'Manage Webhooks', manageNicknames: 'Manage Nicknames' };
class Roleinfo extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'roleinfo';
        this.module = 'Info';
        this.usage = '[role]';
        this.description = 'Get information about a role.';
        this.examples = ['Staff'];
    }

    async execute(msg, args) {
        const role = await this.utils.resolveRole(msg.channel.guild, args.join(' ').trim());
        if (!role) return msg.channel.sendErrorMessage('I could not resolve that role.');
        const members = msg.channel.guild.members.filter(user => user.roles.includes(role.id));
        const embed = {
            title: role.name,
            timestamp: new Date(role.createdAt),
            color: role.color,
            footer: {
                text: `ID: ${role.id} | Role created `
            },
            fields: [
                {
                    name: 'Role',
                    value: role.mention,
                    inline: true
                },
                {
                    name: 'Members',
                    value: members ? members.length : 0,
                    inline: true
                },
                {
                    name: 'Color',
                    value: role.color ? `#${role.color.toString(16)}` : 'None',
                    inline: true
                },
                {
                    name: 'Position',
                    value: role.position,
                    inline: true
                },
                {
                    name: 'Hoisted',
                    value: role.hoist ? 'Yes' : 'No',
                    inline: true
                },
                {
                    name: 'Mentionable',
                    value: role.mentionable ? 'Yes' : 'No',
                    inline: true
                },
                {
                    name: 'Managed',
                    value: role.managed ? 'Yes' : 'No',
                    inline: true
                }
            ]
        };
        let online = 0;
        let dnd = 0;
        let idle = 0;
        let offline = 0;
        members.forEach(member => {
            switch (member.status) {
            case 'online':
                online++;
                break;
            case 'dnd':
                dnd++;
                break;
            case 'idle':
                idle++;
                break;
            default:
                offline++;
                break;
            }
        });
        embed.fields.push({name: 'Members Status', value: `<:online2:651832398354317342> Online: ${online}\n<:dnd2:651832449302659082> DnD: ${dnd}\n<:idle2:651832510870978573> Idle: ${idle}\n<:offline2:651832576025034764> Offline: ${offline}`});
        let perms = [];
        for (const perm in notablePermissions) {
            if (role.permissions.has(perm)) perms.push(notablePermissions[perm]);
        }
        if (perms.length > 0) {
            embed.fields.push({name: 'Permissions', value: perms.sort().join(', '), inline: false});
        }
        return msg.channel.createMessage({ embed });
    }
}
module.exports = Roleinfo;