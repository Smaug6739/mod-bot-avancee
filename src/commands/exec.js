const Command = require('../Command');
const { exec } = require('child_process');

const outputErr = (msg, stdData) => {
    const { stdout, stderr } = stdData;
    const message = stdout.concat(`\`\`\`${stderr}\`\`\``);
    msg.edit(message);
};

const doExec = (cmd, opts = {}) => {
    return new Promise((resolve, reject) => {
        exec(cmd, opts, (err, stdout, stderr) => {
            if (err) return reject({ stdout, stderr });
            resolve(stdout);
        });
    });
};

class Exec extends Command {
    constructor(delta) {
        super(delta);
        this.name = 'exec';
        this.module = 'Bot Owner';
        this.aliases = ['ex', 'execute'];
        this.description = 'Executes a terminal command';
        this.usage = '[command]';
        this.examples = 'git pull';
    }

    async execute(msg, args) {
        const command = args.join(' ');
        const outMessage = await msg.channel.createMessage(`${this.delta.emotes.loading} Executing \`${command}\`...`);
        let stdOut = await doExec(command).catch(data=> outputErr(outMessage, data));
        return outMessage.edit(`\`\`\`bash\n${stdOut.toString()}\n\`\`\``);
    }
}
module.exports = Exec;