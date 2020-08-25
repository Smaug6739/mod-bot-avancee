const Command = require('../Command');

class Lock extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'lock';
        this.module = 'Administration';
        this.cooldown = 5;
        this.permissions = ['manageChannels'];
        this.description = 'Lock a channel/category';
        this.usage = '[channel/category ID]';
        this.examples = ['#general'];
    }

    async execute (msg, args) {
        const channel = this.delta.utils.resolveChannel(msg.channel.guild, args[0]);
        if (!channel) {
            return msg.channel.sendErrorMessage('Channel not found.');
        }
        let channelPerms = channel.permissionOverwrites.has(msg.channel.guild.id) ? channel.permissionOverwrites.get(msg.channel.guild.id) : { json: {}, allow: 0, deny: 0 };
        let botUser = this.delta.utils.resolveMember(msg.channel.guild, this.delta.client.user.id);
        if (!botUser) {
            return msg.channel.sendErrorMessage('I can\'t verify my permissions. I can\'t lock that channel/category.');
        }
        if (!botUser.permission.has('administrator') && !botUser.permission.has('manageGuild') && !botUser.permission.has('manageChannels')) {
            return msg.channel.sendErrorMessage('I don\'t have the permission to lock that channel/category.');
        }
        if (channelPerms.json.sendMessages === false) return msg.channel.sendErrorMessage('That channel is already locked.');
        await channel.editPermission(msg.channel.guild.id, channelPerms.allow, channelPerms.deny | 2048, 'role', 'Lock');
        if (channel.type == '4') {
            return msg.channel.sendSuccessMessage(`Locked category \`${channel.name}\`.`);
        } else if (channel.type == '0') {
            return msg.channel.sendSuccessMessage(`Locked channel ${channel.mention}.`);
        }
    }
}
module.exports = Lock;
