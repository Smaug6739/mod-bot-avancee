const Command = require('../Command');

const translate = require('@vitalets/google-translate-api');

const availableLangs = ['af', 'Afrikaans', 'sq', 'Albanian', 'am', 'Amharic', 'ar', 'Arabic', 'hy', 'Armenian', 'az', 'Azerbaijani', 'eu', 'Basque', 'be', 'Belarusian', 'bn', 'Bengali', 'bs', 'Bosnian', 'bg', 'Bulgarian', 'ca', 'Catalan', 'ceb', 'Cebuano', 'ny', 'Chichewa', 'zh-cn', 'Chinese Simplified', 'zh-tw', 'Chinese Traditional', 'co', 'Corsican', 'hr', 'Croatian', 'cs', 'Czech', 'da', 'Danish', 'nl', 'Dutch', 'en', 'English', 'eo', 'Esperanto', 'et', 'Estonian', 'tl', 'Filipino', 'fi', 'Finnish', 'fr', 'French', 'fy', 'Frisian', 'gl', 'Galician', 'ka', 'Georgian', 'de', 'German', 'el', 'Greek', 'gu', 'Gujarati', 'ht', 'Haitian Creole', 'ha', 'Hausa', 'haw', 'Hawaiian', 'iw', 'Hebrew', 'hi', 'Hindi', 'hmn', 'Hmong', 'hu', 'Hungarian', 'is', 'Icelandic', 'ig', 'Igbo',
    'id', 'Indonesian', 'ga', 'Irish', 'it', 'Italian', 'ja', 'Japanese', 'jw', 'Javanese', 'kn', 'Kannada', 'kk', 'Kazakh', 'km', 'Khmer', 'ko', 'Korean', 'ku', 'Kurdish (Kurmanji)', 'ky', 'Kyrgyz', 'lo', 'Lao', 'la', 'Latin', 'lv', 'Latvian', 'lt', 'Lithuanian', 'lb', 'Luxembourgish', 'mk', 'Macedonian', 'mg', 'Malagasy', 'ms', 'Malay', 'ml', 'Malayalam', 'mt', 'Maltese', 'mi', 'Maori', 'mr', 'Marathi', 'mn', 'Mongolian', 'my', 'Myanmar (Burmese)', 'ne', 'Nepali', 'no', 'Norwegian', 'ps', 'Pashto', 'fa', 'Persian', 'pl', 'Polish', 'pt', 'Portuguese', 'ma', 'Punjabi', 'ro', 'Romanian', 'ru', 'Russian', 'sm', 'Samoan', 'gd', 'Scots Gaelic', 'sr', 'Serbian', 'st', 'Sesotho', 'sn', 'Shona', 'sd', 'Sindhi', 'si', 'Sinhala', 'sk', 'Slovak', 'sl', 'Slovenian', 'so', 'Somali', 'es', 'Spanish', 'su', 'Sundanese', 'sw', 'Swahili', 'sv', 'Swedish', 'tg', 'Tajik', 'ta', 'Tamil', 'te', 'Telugu', 'th', 'Thai', 'tr', 'Turkish', 'uk', 'Ukrainian', 'ur', 'Urdu', 'uz', 'Uzbek', 'vi', 'Vietnamese', 'cy', 'Welsh', 'xh', 'Xhosa', 'yi', 'Yiddish', 'yo', 'Yoruba', 'zu', 'Zulu'];

class Translate extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'translate';
        this.module = 'Fun';
        this.cooldown = 3;
        this.usage = '[language] [text]';
        this.description = 'Translate a sentence using Google Translate.';
        this.examples = ['fr Hello', 'en Bonjour'];
    }

    async execute(msg, args) {
        if (!availableLangs.includes(args[0])) return msg.channel.sendErrorMessage('Cannot find that language.');
        const language = args.shift();
        if (args.length == 0) return msg.channel.sendErrorMessage('Please specify a text to translate.');
        const translation = await translate(args.join(' ').trim(), { to: language });
        msg.channel.createMessage({embed: {
            title: 'Translation',
            timestamp: new Date(),
            footer: {
                text: 'Translation by Google Translate'
            },
            thumbnail: {
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Google_Translate_logo.svg/1200px-Google_Translate_logo.svg.png'
            },
            description: translation.text,
            fields: [
                {
                    name: 'Source Language',
                    value: translation.from.language.iso,
                    inline: true
                },
                {
                    name: 'To',
                    value: language,
                    inline: true
                },
                {
                    name: 'Input',
                    value: translation.from.text.value ? translation.from.text.value : args.join(' ').trim(),
                    inline: true
                }
            ]
        }}).catch(err => msg.channel.sendErrorMessage(` An error occured, please report this to the developers: \n\`\`\`js\n${err}\n\`\`\``));
    }
}
module.exports = Translate;