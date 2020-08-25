const EventEmitter = require('eventemitter3');

class ReactionHandler extends EventEmitter {
    constructor(message, filter, options = {}) {
        super();
        this.client = (message.channel.guild) ? message.channel.guild.shard.client : message.channel._client;
        this.filter = filter;
        this.message = message;
        this.options = options;
        this.ended = false;
        this.collected = [];
        this.client.on('messageReactionAdd', (msg, emoji, userID) => this.verify(msg, emoji, userID, 0));
        this.client.on('messageReactionRemove', (msg, emoji, userID) => this.verify(msg, emoji, userID, 1));

        if (options.time) setTimeout(() => this.stop('time'), options.time);
    }

    verify(msg, emoji, userID, type) {
        if (this.message.id !== msg.id) {
            return false;
        }

        if (this.filter(userID) && type === 0) {
            this.collected.push({ msg, emoji, userID });
            this.emit('reacted', { msg, emoji, userID });

            if (this.collected.length >= this.options.maxMatches) {
                this.stop('maxMatches', 0);
                return true;
            }
        }

        if (this.filter(userID) && type === 1) {
            this.collected.push({ msg, emoji, userID });
            this.emit('unReacted', { msg, emoji, userID });

            if (this.collected.length >= this.options.maxMatches) {
                this.stop('maxMatches', 1);
                return true;
            }
        }

        return false;
    }

    stop(reason, type) {
        if (this.ended) {
            return;
        }
        type = type == 0 ? 'messageReactionAdd' : 'messageReactionRemove';
        this.ended = true;
        this.client.removeListener(type, this.listener);
        this.emit('end', this.collected, reason);
    }
}

module.exports = {
    continuousReactionStream: ReactionHandler,
    collectReactions: (message, filter, options) => {
        const collector = new ReactionHandler(message, filter, options);
        return new Promise(resolve => collector.on('end', resolve));
    }
}; 