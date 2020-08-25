const config = require('../../config');
const moment = require('moment');
require('moment-duration-format');
const Blacklist = require('../models/blacklist');
const Guild = require('../models/guild');
const Eris = require('eris');

async function runReady(delta, startDate) {
    delta.logger.system.success('Connected to Discord');
    delta.client.editStatus('online', { name: 'deltabot.tech | /help', type: 3 });

    const botGateway = await delta.client.getBotGateway();
    if (botGateway.shards > delta.client.shards.size) delta.client.createMessage('627967081014624298', `:warning: Unstable shards number. The bot has **${delta.client.shards.size}** shards, but Discord recommend having **${botGateway.shards}**.`);

    const blacklist = await Blacklist.find();
    if (blacklist && blacklist.length > 0) {
        blacklist.forEach(async guild => {
            if (guild.blacklisted) {
                delta.client.leaveGuild(guild.ID);
                return delta.logger.guilds.fatal(`A blacklisted guild tried adding me. Left it. Guild ID: ${guild.id}`);
            }
        });
    }
    let dbGuilds = await Guild.find();
    if (dbGuilds && dbGuilds.length > 0) {
        dbGuilds.filter(g => g.mute.users.length > 0);
        dbGuilds.forEach(guild => {
            if (!guild.mute.users || guild.mute.users.length == 0) {
                delta.mutedUsers.set(guild.ID, new Eris.Collection());
                guild.mute.users.forEach(user => {
                    if (user.expirationDate) {
                        delta.mutedUsers.get(guild.ID).set(user.ID, user.expirationDate);
                    }
                });
            }
            if (guild.reactionRoles.length > 0) {
                const guildObject = delta.client.guilds.get(guild.ID);
                guild.reactionRoles.forEach(async reactionRole => {
                    const channel = guildObject.channels.get(reactionRole.channelID);
                    const message = await channel.getMessage(reactionRole.messageID).catch(() => undefined);
                    if (!message) return;
                    await delta.utils.listenToReactionRole(delta, message, reactionRole.emoji, guildObject.roles.get(reactionRole.roleID));
                });
            }
        });
    }

    async function checkForMuted() {
        const mutedGuilds = [...delta.mutedUsers.entries()].map(g => g);
        if (mutedGuilds.length == 0) return;
        for (const finalGuild of mutedGuilds) {
            if (finalGuild.length == 0) return;
            // eslint-disable-next-line no-loop-func
            const mutedUsers = [...finalGuild[1].entries()].map(g => g);
            mutedUsers.forEach(async user => {
                const expirationTime = user[1];
                if (!expirationTime) return;
                if (expirationTime <= Date.now()) {
                    const guildDB = await Guild.findOne({ ID: finalGuild[0] });
                    const dbUser = await guildDB.mute.users.find(usr => usr.ID == user[0]);
                    const index = guildDB.mute.users.indexOf(dbUser);
                    guildDB.mute.users.splice(index);
                    await guildDB.save();
                    finalGuild[1].delete(user[0]);
                    if (!delta.mutedUsers.get(finalGuild[0]) && delta.mutedUsers.get(finalGuild[0]).size == 0) delta.mutedUsers.delete(finalGuild[0]);

                    //if the user is in the guild
                    const guildObject = await delta.utils.resolveGuild(finalGuild[0]);
                    const member = await delta.utils.resolveMember(guildObject, user[0]);
                    if (!member) {
                        return;
                    }
                    await member.removeRole(guildDB.mute.roleID, 'auto').catch();
                    delta.utils.createModLogCase(this.delta, user, 'unmute', 'auto', null, guildObject.members.get(delta.client.user.id));
                    return;
                }
            });
        }
    }

    let DBLUsers = await delta.db.DBLUser.find();
    DBLUsers.map(g => g.ID).forEach((user, i) => {
        const member = delta.client.guilds.get('627967081014624294').members.get(user);
        const hasVoted = delta.client.dblClient.hasVOted(member.id);
        setTimeout(() => {
            if (hasVoted && !member.roles.includes('667451645180903428')) member.addRole('667451645180903428').catch();
            if (!hasVoted && member.roles.includes('667451645180903428')) member.removeRole('667451645180903428').catch();
        }, i * 2000);
    });

    const timeTaken = moment.duration(Date.now() - startDate).format(' D [days], H [hours], m [mins], s [seconds], ms [ms]');
    if (config.webhooks.readyLogs) {
        delta.client.executeWebhook(config.webhooks.readyLogs.ID, config.webhooks.readyLogs.token, {
            embeds: [{
                timestamp: new Date(delta.client.startTime),
                thumbnail: {
                    url: delta.client.user.avatarURL
                },
                color: delta.constants.green,
                fields: [
                    {
                        name: 'Event',
                        value: 'Ready',
                        inline: true
                    },
                    {
                        name: 'Users',
                        value: delta.client.users.size,
                        inline: true
                    },
                    {
                        name: 'Guilds',
                        value: delta.client.guilds.size,
                        inline: true
                    },
                    {
                        name: 'Time Taken',
                        value: timeTaken,
                        inline: true
                    }
                ],
                footer: {
                    icon_url: delta.client.avatarURL,
                    text: `${delta.client.user.username} | Bot ID: ${delta.client.user.id} | Started`
                }
            }
            ]
        });
    }
    setInterval(checkForMuted, 60000);
}

module.exports = runReady;