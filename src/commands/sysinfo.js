const Command = require('../Command');
const moment = require('moment');
require('moment-duration-format');
const os = require('os');
const { promisify } = require('util');

const childProcess = require('child_process');
const exec = promisify(childProcess.exec);

function dataConversion(bytes) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    if (bytes === 0) {
        return '0 KB';
    }
    // eslint-disable-next-line no-mixed-operators
    return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`;
}

  
class Sysinfo extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'sysinfo';
        this.module = 'Info';
        this.description = 'Get information about the systems hosting Delta.';
        this.argsRequired = false;
    }

    async execute(msg) {
        let availableMemory;
        const res = await exec('free -b');
        availableMemory = `${res.stdout}${res.stderr}`;
        const usedMemory = dataConversion(os.totalmem() - Number(availableMemory.split('\n')[1].split(' ').slice(-1)[0]));
        const date = new Date();
        date.setMilliseconds(-(moment.duration(os.uptime(), 's').asMilliseconds()));
        const embed = {
            title: 'System Information & Statistics',
            thumbnail: {
                url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Logo-ubuntu_cof-orange-hex.svg/1200px-Logo-ubuntu_cof-orange-hex.svg.png'
            },
            fields: [{ name: 'Operating System', value: 'Ubuntu 18.04', inline: true}, { name: 'Uptime', value: moment.duration(os.uptime(), 's').humanize(), inline: true }, { name: 'CPU', value: `${os.cpus()[0].model} ${os.cpus()[0].speed / 1000}GHz | ${os.cpus().length} Cores | ${os.arch()}`, inline: true }, 
                { name: 'Load Average (last 15 minutes)', value: os.loadavg()[2].toFixed(3), inline: true}, { name: 'Memory/RAM', value: `${usedMemory} / ${dataConversion(os.totalmem())}`, inline: true}],
            footer: {
                text: 'Last restart'
            },
            timestamp: date
        };
        return msg.channel.createMessage({ embed });
    }
}
module.exports = Sysinfo;