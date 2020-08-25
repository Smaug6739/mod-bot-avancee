const Command = require('../Command');

class Serverinfo extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'serverinfo';
        this.module = 'Info';
        this.argsRequired = false;
        this.description = 'Get information about the server';
        this.usage = '';
    }

    async execute(msg) {
        const guild = msg.channel.guild;
        let textChannels = 0;
        let voiceChannels = 0;
        let categories = 0;
        let others = 0;
        guild.channels.forEach(channel => {
            switch (channel.type) {
            case '0':
                textChannels++;
                break;
            case '2':
                voiceChannels++;
                break;
            case '4':
                categories++;
                break;
            default:
                others++;
            }
        });
        let online = 0;
        let idle = 0;
        let dnd = 0;
        let offline = 0;
        guild.members.forEach(member => {
            switch (member.status) {
            case 'online':
                online++;
                break;
            case 'idle':
                idle++;
                break;
            case 'dnd':
                dnd++;
                break;
            default:
                offline++;
            }
        });
        let guildFeatures = [];
        if (guild.features.length > 0) {
            let features = guild.features;
            features.forEach(feature => {
                let firstLetter = feature[0];
                let other = feature.substr(1, feature.length - 1).replace('_', ' ');
                guildFeatures.push(firstLetter.toUpperCase() + other.toLowerCase());
            });
            guildFeatures = guildFeatures.join(', ');
        }
        let embed = {
            timestamp: new Date(guild.createdAt),
            author: {
                name: guild.name,
                icon_url: guild.iconURL
            },
            thumbnail: {
                url: guild.iconURL
            },
            fields: [
                {
                    name: 'Region',
                    value: guild.region,
                    inline: true
                },
                {
                    name: 'Member Count',
                    value: guild.memberCount,
                    inline: true
                },
                {
                    name: 'Owner',
                    value: `<@!${guild.ownerID}>`,
                    inline: true
                },
                {
                    name: 'Verification Level',
                    value: `${guild.verificationLevel}/4`,
                    inline: true
                },
                {
                    name: 'Roles',
                    value: guild.roles.size,
                    inline: true
                },
                {
                    name: 'Nitro Boosting',
                    value: `<:Booster:701100854081749053> Level: ${guild.premiumTier}\nBoosters: ${guild.premiumSubscriptionCount}`,
                    inline: true
                },
                {
                    name: `Channels (${guild.channels.size - categories})`,
                    value: `<:Channel:704387227274313820> Text: ${textChannels}\n<:Voice:704387228339798127> Voice: ${voiceChannels}\n:grey_question: Others: ${others}\n:file_folder: Categories: ${categories}`,
                    inline: true
                },
                {
                    name: 'Members Status',
                    value: `<:online2:651832398354317342> Online: ${online}\n<:idle2:651832510870978573> Idle: ${idle}\n<:dnd2:651832449302659082>Do Not Disturb: ${dnd}\n<:offline2:651832576025034764> Offline: ${offline}`,
                    inline: true
                }
            ],
            footer: {
                text: `Server ID: ${guild.id} | Server Created`
            }
        };
        if (guildFeatures.length > 0) embed.fields.push({ name: 'Server Features', value: guildFeatures, inline: true });


        const guildConfig = await this.delta.db.Guild.findOne({ ID: msg.channel.guild.id });
        if (guildConfig.premium) embed.title = (`${this.delta.emotes.vip} | Server Information`);
        else embed.title = ('Server Information');

        let rols = [...guild.roles.values()].sort((a, b) => b.position - a.position);
        rols.pop();
        const roles = rols.map(r => r.mention);
        if (roles.length > 0 && roles.join(' ').length <= 1024) embed.fields.push({name: 'Roles', value: roles.join(' '), inline: false});


        msg.channel.createMessage({embed});
    }
}
module.exports = Serverinfo;