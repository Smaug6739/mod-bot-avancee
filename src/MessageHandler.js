const Eris = require('eris');
const config = require('../config');

class MessageHandler {
    constructor(delta) {
        this.delta = delta;
        this.cooldowns = new Eris.Collection();
        this.emotes = this.delta.emotes;
        this.utils = this.delta.utils;
        this.minimumPermissions = ['readMessages', 'sendMessages', 'embedLinks'];
    }

    async handle(msg) {
        if (msg.author.bot) return;
        const cmd = await this.delta.utils.resolveCommand(msg, this.delta);
        if (cmd) {
            const command = cmd.command;
            const guildConfig = await this.delta.db.Guild.findOne({ ID: msg.channel.guild.id });
            if (!guildConfig) {
                const doc = new this.delta.db.Guild({ ID: msg.channel.guild.id });
                await doc.save();
            }
            if (guildConfig && guildConfig.prefix && guildConfig.prefix != this.delta.prefix && command.prefix == this.delta.prefix) return;
            if (command.vip && !this.delta.utils.isVIP(this.delta, msg.author) && !guildConfig.premium) return msg.channel.sendErrorMessage(`That command is a VIP command. To be a VIP, you need to upvote for us on DBL, boost the support server or become a donator. You can find the links for that by running \`${cmd.prefix}info\`.`);
            if (cmd.prefix !== '$') {
                //modules
                const isMod = await this.delta.utils.checkMod(msg.channel.guild, msg.member);
                if (guildConfig && guildConfig.modOnly && !isMod) return;
                if (command.module == 'Bot Owner' && msg.author.id !== this.delta.owner.id) return;
                if (command.module == 'Bot Admin' && !config.adminsIDs.includes(msg.author.id) && msg.author.id !== this.delta.owner.id) return;
                if (command.module == 'Administration' && !msg.member.permission.has('manageGuild' || 'administrator')) return;
                if (command.module == 'Moderation' && !isMod) return;

                if (cmd.subcommand) {
                    if (cmd.subcommand.module == 'Bot Owner' && msg.author.id !== this.delta.owner.id) return;
                    if (cmd.subcommand.module == 'Bot Admin' && !config.adminsIDs.includes(msg.author.id)) return;
                    if (cmd.subcommand.module == 'Administration' && !msg.member.permission.has('manageGuild' || 'administrator')) return;
                    if (cmd.subcommand.module == 'Moderation' && !isMod) return;
                }

                if (!this.cooldowns.has(command.name)) {
                    this.cooldowns.set(command.name, new Eris.Collection());
                }

                const now = Date.now();
                const timestamps = this.cooldowns.get(command.name);
                const cooldownAmount = (command.cooldown || 2) * 1000;

                if (timestamps.has(msg.author.id) && msg.author.id !== this.delta.owner.id) {
                    const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

                    if (now < expirationTime) {
                        return msg.channel.sendErrorMessage('You are trying to use a command too quick, please slow down.').then((message) => setTimeout(() => message.delete(), 5000));
                    }
                }

                timestamps.set(msg.author.id, now);
                setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);

                let pendingPermissions = !cmd.subcommand && command.permissions && command.permissions.length > 0 ? this.minimumPermissions.concat(command.permissions) : this.minimumPermissions;
                if (cmd.subcommand) pendingPermissions = cmd.subcommand.permissions && cmd.subcommand.permissions.length > 0 ? this.minimumPermissions.concat(cmd.subcommand.permissions) : this.minimumPermissions;
                let missingPermissions = [];

                for (let i = 0; i < pendingPermissions.length; i++) {
                    if (!msg.channel.permissionsOf(this.delta.client.user.id).has(pendingPermissions[i]) && !msg.channel.permissionsOf(this.delta.client.user.id).has('administrator')) {
                        missingPermissions.push(pendingPermissions[i]);
                    }
                }

                if (!missingPermissions.includes('manageMessages') && guildConfig && guildConfig.modOnly && command.module == 'Moderation') msg.delete();
                if (missingPermissions.length) {
                    return msg.channel.sendErrorMessage(` I can't run that command because I need the following permissions: \`${missingPermissions.join(', ')}\``);
                }
                if ((typeof command.execute !== 'function' && !cmd.subcommand) || (!cmd.args[0] && !cmd.subcommand && command.argsRequired)) {
                    return this.delta.utils.sendCommandHelp(msg, cmd.command, cmd.prefix);
                }
                if (!cmd.args[0] && cmd.subcommand && cmd.subcommand.argsRequired) {
                    return this.delta.utils.sendSubcommandHelp(msg, cmd.command, cmd.subcommand, cmd.prefix);
                }

                try {
                    if (cmd.subcommand) await cmd.subcommand.execute(msg, cmd.args, guildConfig, this.cooldowns);
                    if (cmd.command && !cmd.subcommand) await command.execute(msg, cmd.args, guildConfig, this.cooldowns);
                } catch (err) {
                    if (config.webhooks.commandLogs) {
                        return this.delta.client.executeWebhook(config.webhooks.commandLogs.ID, config.webhooks.commandLogs.token, {
                            content: `<@&627968351754387467> An error occured: \n\`\`\`js\n${err.stack}\n\`\`\``,
                            embeds: [{
                                color: 0xFF0000,
                                author: {
                                    name: `${msg.author.username}#${msg.author.discriminator}`,
                                    icon_url: msg.author.avatarURL
                                },
                                title: 'Message that caused this error',
                                description: `**Content: ${msg.content}** [Jump to message](https://discord.com/channels/${msg.channel.guild.id}/${msg.channel.id}/${msg.id})`,
                                fields: [
                                    {
                                        name: 'Mention',
                                        value: msg.author.mention,
                                        inline: true
                                    },
                                    {
                                        name: 'Guild',
                                        value: `${msg.channel.guild.name}`,
                                        inline: true
                                    },
                                    {
                                        name: 'Channel',
                                        value: `${msg.channel.name} (\`${msg.channel.id}\`)`,
                                        inline: true
                                    }
                                ],
                                footer: {
                                    text: `Guild ID: ${msg.guild.id}`
                                }
                            }]
                        });
                    }
                    return this.delta.logger.signale.error(err.stack);
                }

                if (msg.author.id !== this.delta.owner.id) {
                    return this.delta.client.executeWebhook(config.webhooks.commandLogs.ID, config.webhooks.commandLogs.token, {
                        embeds: [{
                            title: 'Command Executed',
                            timestamp: new Date(),
                            fields: [
                                {
                                    name: 'User',
                                    value: `${msg.author.username}#${msg.author.discriminator} (\`${msg.author.id})\``,
                                    inline: true
                                },
                                {
                                    name: 'Guild',
                                    value: `${msg.channel.guild.name} (\`${msg.channel.guild.id}\`)`,
                                    inline: true
                                },
                                {
                                    name: 'Channel',
                                    value: `${msg.channel.name} (\`${msg.channel.id}\`)`,
                                    inline: true
                                },
                                {
                                    name: 'Command',
                                    value: command.name,
                                    inline: true
                                },
                                {
                                    name: 'Usage',
                                    value: `\`${msg.content}\``,
                                    inline: true
                                }
                            ],
                            thumbnail: {
                                url: msg.author.avatarURL
                            },
                            footer: {
                                icon_url: this.delta.client.user.avatarURL,
                                text: this.delta.client.user.username
                            }
                        }]
                    });
                }
            }

            if (cmd.prefix == '$' && msg.author.id == this.delta.owner.id) {
                if (!cmd.args[0] && command.argsRequired) {
                    return this.delta.utils.sendCommandHelp(msg, cmd.command, cmd.prefix);
                }
                if (!cmd.args[1] && cmd.subcommand) {
                    return this.delta.utils.sendSubcommandHelp(msg, cmd.command, cmd.subcommand, cmd.prefix);
                }

                if (cmd.subcommand) return cmd.subcommand.execute(msg, cmd.args, this.cooldowns);
                if (cmd.command && !cmd.subcommand) return command.execute(msg, cmd.args, this.cooldowns);
            }
        }
        const guildConfig = await this.delta.db.Guild.findOne({ ID: msg.channel.guild.id });
        if (!guildConfig || !guildConfig.linkedChannels.length) return;

        let stop = false;
        // eslint-disable-next-line no-return-assign
        let webhooks = await msg.channel.getWebhooks().catch(() => stop = true);
        if (stop) return;
        webhooks = webhooks.map(w => w.id);

        let firstWebhookID;
        if (guildConfig.linkedChannels.length > 0 && guildConfig.linkedChannels.find(a => a.find(w => webhooks.includes(w)))) {
            firstWebhookID = guildConfig.linkedChannels.find(a => a.find(w => webhooks.includes(w))).find(b => webhooks.includes(b));
            if (!firstWebhookID) return;
            let otherWebhook = await this.delta.client.getWebhook(guildConfig.linkedChannels.find(a => a.includes(firstWebhookID)).find(w => w !== firstWebhookID));
            return this.delta.client.executeWebhook(otherWebhook.id, otherWebhook.token, {
                auth: true,
                content: msg.content,
                username: msg.author.username,
                avatarURL: msg.member.avatarURL,
                allowedMentions: {
                    everyone: false,
                    roles: false,
                    users: true
                }
            }).catch();
        }
    }
}
module.exports = MessageHandler;