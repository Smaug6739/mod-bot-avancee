/* eslint-disable prefer-named-capture-group */
const axios = require('axios');
const Command = require('../Command');

class Emoji extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'emoji';
        this.module = 'Fun';
        this.usage = '[emoji]';
        this.aliases = ['emojis', 'emotes', 'emote'];
        this.description = 'Manage emojis';
        this.examples = ['<:DiscordTools:640985652606795776>'];
        this.subcommands = [
            {
                name: 'create',
                execute: async(msg, args) => {
                    if (args.length < 2 && msg.attachments.length !== 1) {
                        let command = await this.utils.resolveCommand(msg, this.delta);
                        return this.utils.sendSubcommandHelp(msg, command.command, command.subcommand, command.prefix);
                    }
                    let base64Image;
                    if (args[1] && (/<a?:([a-z0-9-_]+):(\d+)>/gi).test(args[1])) {
                        let extension = args[1].startsWith('<a:') ? '.gif' : '.png';
                        let emoteLink = `https://cdn.discordapp.com/emojis/${args[1].replace('<:', '').replace('<a:', '').replace('>', '').split(':')[1]}${extension}`;
                        const query = await axios({
                            url: emoteLink,
                            responseType: 'arraybuffer'
                        }).catch(() => msg.channel.sendErrorMessage('I couldn\'t find that emote'));
                        let data = Buffer.from(query.data, 'binary');
                        base64Image = `data:image/${extension.slice(1)};base64,` + data.toString('base64');
                    }
                    if (args[1] && (args[1].startsWith('https://') || args[1].startsWith('http://'))) {
                        let extension = args[1].includes('.gif') ? 'gif' : 'png';
                        const query = await axios({
                            url: args[1],
                            responseType: 'arraybuffer'
                        }).catch(() => msg.channel.sendErrorMessage('Invalid URL'));
                        let data = Buffer.from(query.data, 'binary');
                        base64Image = `data:image/${extension};base64,` + data.toString('base64');
                    }
                    if (!args[1] && msg.attachments.length == 1) {
                        let extension = msg.attachments[0].url.endsWith('.gif') ? 'gif' : 'png';
                        const query = await axios({
                            url: msg.attachments[0].url,
                            responseType: 'arraybuffer',
                        });
                        base64Image = `data:image/${extension};base64,` + query.data.toString('base64');
                    }
                    const emote = await msg.channel.guild.createEmoji({
                        name: args[0],
                        image: base64Image
                    });
                    return msg.channel.createMessage({embed: {
                        color: this.delta.constants.colors.green,
                        title: `${this.delta.emotes.success} Emoji created`,
                        thumbnail: {
                            url: `https://cdn.discordapp.com/emojis/${emote.id}${emote.animated ? '.gif' : '.png'}`
                        },
                        fields: [
                            {
                                name: 'Name',
                                value: emote.name,
                                inline: true
                            },
                            {
                                name: 'Emoji',
                                value: `<${emote.animated ? 'a' : ''}:${emote.name}:${emote.id}>`,
                                inline: true
                            }
                        ]
                    }
                    });
                },
                permissions: ['manageEmojis'],
                module: 'Administration',
                aliases: ['add', 'upload'],
                usage: '[name] (emoji/URL)',
                description: 'Add an emoji to the server, you can also specify an attachment',
                examples: ['Delta <:Delta:709325663269814293>', 'Delta https://cdn.discordapp.com/emojis/709325663269814293.png']
            },
            {
                name: 'delete',
                execute: async(msg, args) => {
                    const emote = await delta.utils.resolveGuildEmoji(msg.channel.guild, args[0]);
                    if (!emote) return msg.channel.sendErrorMessage('Emote not found.');
                    await msg.channel.guild.deleteEmoji(emote.id);
                    return msg.channel.sendSuccessMessage('Emoji deleted.');
                },
                permissions: ['manageEmojis'],
                module: 'Administration',
                usage: '[name]',
                description: 'Delete an emoji',
                examples: ['Delta']
            },
            {
                name: 'list',
                execute: async(msg) => {
                    const emojisList = msg.channel.guild.emojis.map(emote => `<${emote.animated ? 'a' : ''}:${emote.name}:${emote.id}>`);
                    let embed = {
                        title: `Emojis for **${msg.channel.guild.name}** | ${msg.channel.guild.emojis.length} total | ${msg.channel.guild.emojis.filter(e => !e.animated).length} statics | ${msg.channel.guild.emojis.filter(e => e.animated).length} animated`,
                        description: null,
                        fields: []
                    };
                    if (emojisList.join(' ').length > 2048) {
                        let i = '';
                        // eslint-disable-next-line guard-for-in
                        emojisList.forEach(emote => {
                            if (i.length <= 1024 && i.length + emote.length > 1024) embed.fields.push({name: '\u200b', value: i, inline: true});
                            i = i.concat(' ', emote);
                        });
                    } else {
                        embed.description = emojisList.join(' ');
                    }
                    return msg.channel.createMessage({embed});
                },
                module: 'Fun',
                description: 'List the emojis of the server',
                argsRequired: false
            }
        ];
    }

    async execute(msg, args) {
        const emoteID = args[0].trim().replace('<:', '').replace('<a:', '').replace('>', '').split(':')[1];
        if (!emoteID) return msg.channel.sendErrorMessage('I could not find that emote.');
        const emoteURL = `https://cdn.discordapp.com/emojis/${emoteID + args[0].startsWith('<a:') ? '.gif' : '.png'}`;
        return msg.channel.createMessage({embed: {
            image: {
                url: emoteURL
            }
        }
        }).catch(() => msg.channel.sendErrorMessage('An error occured, that emoji is probably not a custom discord emoji.'));
    }
}
module.exports = Emoji;