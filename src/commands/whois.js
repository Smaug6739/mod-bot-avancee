/* eslint-disable require-atomic-updates */
const Command = require('../Command');
const moment = require('moment');
const Eris = require('eris');

async function getAcks(delta, user, supportServer) {
    const supportServerMember = await supportServer.members.get(user.id);
    if (!supportServerMember || !supportServerMember.roles || supportServerMember.roles.length <= 0) return;

    let acks = [];
    if (user.id == delta.owner.id) acks.push('Lead Developer');
    if (user.id == '401760501387755520') acks.push('Community Manager');
    if (user.id == delta.client.user.id) acks.push('Delta:tm:');
    supportServerMember.roles.forEach(role => {
        if (role == '639533219196305410') acks.push('Delta Management');
        if (role == '627968450819653632') acks.push('Delta Staff');
        if (role == '642675320893341727') acks.push('Donator :heart:');
    });
    return acks.join(', ');
}

function getBadges(user) {
    let userFlags = Eris.Constants.UserFlags;
    const flagsNames = [];
    let badges = [];
    const flagNums = Object.entries(userFlags).filter(flag => Boolean(flag[1] & user.publicFlags));
    flagNums.forEach(flag => {
        flagsNames.push(flag[0]);
    });
    flagsNames.forEach(badge => {
        if (badge == 'DISCORD_EMPLOYEE') badges.push('<:DiscordTools:640985652606795776>');
        if (badge == 'DISCORD_PARTNER') badges.push('<:DiscordPartner:640984807483899947>');
        if (badge == 'HYPESQUAD_EVENTS') badges.push('<:HypesquadEvents:700691534227701781>');
        if (badge == 'HOUSE_BRAVERY') badges.push('<:HouseBravery:700694022934626304>');
        if (badge == 'HOUSE_BRILLIANCE') badges.push('<:HouseBrilliance:700694356599767142>');
        if (badge == 'HOUSE_BALANCE') badges.push('<:HouseBalance:700694783873777734>');
        if (badge == 'BUG_HUNTER_LEVEL_1' || badge == 'BUG_HUNTER_LEVEL_2') badges.push('<:BugHunter:640985721364021248>');
        if (badge == 'EARLY_SUPPORTER') badges.push('<:EarlySupporter:700695775105253426>');
        if (badge == 'VERIFIED_BOT_DEVELOPER') badges.push('<:VerifiedBotDeveloper:701093856220807198>');
        if (badge == 'VERIFIED_BOT') badges.push('<:VerifiedBot:704705083199193219>');
    });

    if (user.bot && !badges.find(badge => badge == 'VERIFIED_BOT')) badges.push('<:DiscordBot:638033448359166000>');

    return badges;
}
class Whois extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'whois';
        this.module = 'Info';
        this.argsRequired = false;
        this.aliases = ['userinfo'];
        this.usage = '(user)';
        this.description = 'Provide information about a user';
        this.examples = ['', 'Hector'];
    }

    async execute(msg, args) {
        let user;
        const supportServer = await this.delta.client.guilds.get('627967081014624294');
        if (!args[0]) user = msg.member;
        if (args.length > 0) {
            user = await this.utils.resolveMember(msg.channel.guild, args.join(''));
            if (!user) {
                let user;
                try {
                    user = await this.delta.client.getRESTUser(args[0]);
                } catch (err) {
                    return msg.channel.sendErrorMessage('That user doesn\'t exist');
                }
                const acks = await getAcks(this.delta, user, supportServer);
                let badges = getBadges(user);
                badges = badges.length > 0 ? badges.join(' ') + '\n\n' : '';
                let embed = {
                    author: {
                        name: `${user.username}#${user.discriminator}`,
                        icon_url: user.avatarURL ? user.avatarURL : user.defaultAvatarURL
                    },
                    description: badges + '**That user is not in the server**',
                    thumbnail: {
                        url: user.avatarURL ? user.avatarURL : user.defaultAvatarURL
                    },
                    timestamp: new Date(user.createdAt),
                    footer: {
                        text: `ID: ${user.id} | Account created `
                    },
                    fields: []
                };
                if (acks && acks.length > 0) embed.fields.push({ name: 'Acknowledgements', value: acks, inline: false });
                return msg.channel.createMessage({ embed });
            }
        }

        // if the user is in the server
        let badges = getBadges(user.user);
        if (msg.channel.guild.ownerID == user.id) badges.push('<:Owner:700780159719964682>');
        if (user.premiumSince) badges.push('<:Booster:701100854081749053>');
        let status;
        if (user.status == 'online') status = '<:online2:651832398354317342> Online';
        if (user.status == 'dnd') status = '<:dnd2:651832449302659082> Do Not Disturb';
        if (user.status == 'idle') status = '<:idle2:651832510870978573> Idle';
        if (user.status == 'offline') status = '<:offline2:651832576025034764> Offline';
        let platform = 'Offline';
        if (user.clientStatus && user.clientStatus.web !== 'offline') platform = ':earth_americas: Web';
        if (user.clientStatus && user.clientStatus.desktop !== 'offline') platform = ':desktop: Desktop';
        if (user.clientStatus && user.clientStatus.mobile !== 'offline') platform = ':iphone: Mobile';
        const joinPos = [...msg.channel.guild.members.values()].sort((a, b) => a.joinedAt - b.joinedAt);
        const usr = joinPos.find(m => m.id == user.id);
        let joinPosition = joinPos.indexOf(usr);
        let rols = user.roles.sort((a, b) => msg.channel.guild.roles.get(b).position - msg.channel.guild.roles.get(a).position);
        const roles = rols.map(r => msg.channel.guild.roles.get(r).mention);
        let perms = [];
        const notablePermissions = { kickMembers: 'Kick Members', banMembers: 'Ban Members', administrator: 'Administrator', mentionEveryone: 'Mention Everyone', manageGuild: 'Manage Guild', manageChannels: 'Manage Channels', manageRoles: 'Manage Roles', manageMessages: 'Manage Messages', manageEmojis: 'Manage Emojis', manageWebhooks: 'Manage Webhooks', manageNicknames: 'Manage Nicknames' };
        for (const perm in notablePermissions) {
            if (user.permission.has(perm)) perms.push(notablePermissions[perm]);
        }
        const acks = await getAcks(this.delta, user, supportServer);
        let embed = {
            color: user.color > 0 ? user.color : null,
            thumbnail: {
                url: user.avatarURL ? user.avatarURL : user.defaultAvatarURL
            },
            timestamp: new Date(user.createdAt),
            footer: {
                text: `ID: ${user.id} | Account created `
            },
            author: {
                name: `${user.username}#${user.discriminator}`,
                icon_url: user.avatarURL ? user.avatarURL : user.defaultAvatarURL
            },
            fields: [
                {
                    name: 'Status',
                    value: status,
                    inline: true
                },
                {
                    name: 'Game',
                    value: user.game ? user.game.name : 'None',
                    inline: true
                },
                {
                    name: 'Platform',
                    value: platform,
                    inline: true
                },
                {
                    name: 'Joined Date',
                    value: `${moment(user.joinedAt).format('dddd, MMMM Do YYYY')} (${moment(user.joinedAt).fromNow()})`,
                    inline: true
                },
                {
                    name: 'Join Position',
                    value: joinPosition += 1,
                    inline: true
                }
            ]
        };
        if (this.delta.utils.isVIP(this.delta, msg.author)) embed.description = (`${this.delta.emotes.vip} | ${user.mention} ${badges.join(' ')}`);
        else embed.description = (`${user.mention} ${badges.join(' ')}`);
        if (roles.length > 0 && roles.length <= 50) embed.fields.push({name: 'Roles', value: roles.join(' '), inline: false});
        if (perms && perms.length > 0) embed.fields.push({name: 'Permissions', value: perms.sort().join(', '), inline: false});
        if (acks && acks.length > 0) embed.fields.push({name: 'Acknowledgements', value: acks, inline: false});
        return msg.channel.createMessage({ embed });

    }
}
module.exports = Whois;