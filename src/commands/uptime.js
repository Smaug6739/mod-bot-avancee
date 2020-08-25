const Command = require('../Command');
const moment = require('moment');
require('moment-duration-format');

class Uptime extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'uptime';
        this.module = 'Info';
        this.argsRequired = false;
        this.description = 'Get the bot\'s uptime';
        this.aliases = ['up'];
    }

    async execute(msg) {
        let txt = 'Staging';
        if (this.delta.client.user.id == '534632914445664267') txt = 'Production';
        if (this.delta.client.user.id == '618124899420209167') txt = 'Development';
        const duration = moment.duration(process.uptime(), 'seconds').format(' D [days], H [hours], m [mins], s [seconds]');
        const embed = {
            title: ':control_knobs: Uptime',
            color: 0x4F98FF,
            description: duration,
            footer: {
                text: `${this.delta.client.user.username} | ${txt} | ID: ${this.delta.client.user.id} | Last Started`,
                icon_url: this.delta.client.user.avatarURL
            },
            timestamp: new Date(this.delta.client.startTime)
        };
        msg.channel.createMessage({ embed });
    }
}
module.exports = Uptime;