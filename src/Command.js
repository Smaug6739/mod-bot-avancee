class Command {
    constructor(delta) {
        this.delta = delta;
        this.emotes = this.delta.emotes;
        this.utils = this.delta.utils;
        this.argsRequired = true;
        this.vip = false;
    }
}

module.exports = Command;