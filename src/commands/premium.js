const Command = require('../Command');

class Premium extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'premium';
        this.module = 'Bot Admin';
        this.description = 'Register or delete a premium server for the specified user.';
        this.argsRequired = false;
        this.subcommands = [
            {
                name: 'add',
                execute: async(msg, args) => {
                    const user = this.utils.resolveMember(msg.channel.guild, args[0]) || await delta.client.getRESTUser(args[0]).catch(() => undefined);
                    const guild = delta.client.guilds.get(args[1]);
                    if (!user) return delta.client.sendErrorMessage('Cannot find that user');
                    if (!guild) return delta.client.sendErrorMessage('Cannot find that guild');
                    const guildDoc = await delta.db.Guild.findOne({ID: guild.id});
                    if (guildDoc && guildDoc.premium) return msg.channel.sendErrorMessage('That server is already a premium server');
                    if (!guildDoc) {
                        const newDoc = new this.delta.db.Guild({ID: guild.id, premium: true, premiumUserID: user.id});
                        await newDoc.save();
                    }
                    await guildDoc.updateOne({premium: true, premiumUserID: user.id});
                    return msg.channel.sendSuccessMessage(`**${guild.name}** is now a premium server.`);
                },
                usage: '[userID] [server ID]'
            },
            {
                name: 'remove',
                execute: async(msg, args) => {
                    const user = this.utils.resolveMember(msg.channel.guild, args[0]) || await delta.client.getRESTUser(args[0]).catch(() => undefined);
                    const guild = delta.client.guilds.get(args[1]);
                    if (!user) return delta.client.sendErrorMessage('Cannot find that user');
                    if (!guild) return delta.client.sendErrorMessage('Cannot find that guild');
                    const guildDoc = await delta.db.Guild.findOne({ID: guild.id});
                    if (!guildDoc || !guildDoc.premium) return msg.channel.sendErrorMessage('That server is not a premium server');
                    await guildDoc.updateOne({premium: false, premiumUserID: undefined});
                    return msg.channel.sendSuccessMessage(`**${guild.name}** is no longer a premium server.`);
                }
            }
        ];
    }
}
module.exports = Premium;