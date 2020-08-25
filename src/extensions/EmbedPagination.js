const ReactionHandler = require('./ReactionHandler');

class PaginationEmbed {
    constructor(message, pages = [], options = {}) {
        this.pages      = pages;
        this.invoker    = message;
        this.options    = options;
        this.delete     = options.deleteButton  || '🗑';
        this.firstPage  = options.firstButton   || '⏮';
        this.lastPage   = options.lastButton    || '⏭';
        this.back       = options.backButton    || '◀️';
        this.forth      = options.forthButton   || '▶️';
        this.page       = options.startPage     || 1;
        this.maxMatches = options.maxMatches    || 50;
        this.timeout    = options.timeout       || 300000;
        this.cycling    = options.cycling       || false;
        this.showPages  = (typeof options.showPageNumbers !== 'undefined') ? options.showPageNumbers : true;
        this.advanced   = (typeof options.extendedButtons !== 'undefined') ? options.extendedButtons : false;
    }

    async initialize() {
        if (this.pages.length < 2) {
            return Promise.reject(new Error('A Pagination Embed must contain at least 2 pages!'));
        }

        if (this.page < 1 || this.page > this.pages.length) {
            return Promise.reject(new Error(`Invalid start page! Must be between 1 (first) and ${this.pages.length} (last)`));
        }

        if (this.maxMatches > 100) {
            return Promise.reject(new Error('Maximum amount of page changes exceeded! Must be under 100!'));
        }

        if (this.timeout > 900000) {
            return Promise.reject(new Error('Embed Timeout too high! Maximum pagination lifespan allowed is 15 minutes (900000 ms)!'));
        }

        const messageContent = {
            content: (this.showPages) ? `Page **${this.page}** of **${this.pages.length}**` : undefined,
            embed: this.pages[this.page - 1]
        };
        
        if (this.invoker.author.id === this.invoker._client.user.id) {
            this.message = await this.invoker.edit(messageContent);
        } else {
            this.message = await this.invoker.channel.createMessage(messageContent);
        }

        // eslint-disable-next-line new-cap
        this.handler = new ReactionHandler.continuousReactionStream(this.message, (userID) => userID === this.invoker.author.id, false, { maxMatches: this.maxMatches, time: this.timeout });

        if (this.advanced) {
            await this.message.addReaction(this.firstPage);
            await this.message.addReaction(this.back);
            await this.message.addReaction(this.forth);
            await this.message.addReaction(this.lastPage);
            await this.message.addReaction(this.delete);
        } else {
            await this.message.addReaction(this.back);
            await this.message.addReaction(this.forth);
        }
    }

    update() {
        this.message.edit({
            content: (this.showPages) ? `Page **${this.page}** of **${this.pages.length}**` : undefined,
            embed: this.pages[this.page - 1]
        });
    }

    checkPerms() {
        return this.message.channel.guild && this.message.channel.permissionsOf(this.message._client.user.id).has('manageMessages');
    }

    run() {
        this.handler.on('reacted', async (event) => {
            // eslint-disable-next-line default-case
            switch (event.emoji.name) {
            case this.firstPage: {
                if (this.advanced) {
                    if (this.checkPerms()) {
                        await this.message.removeReaction(this.firstPage, this.invoker.author.id);
                    }

                    if (this.page > 1) {
                        this.page = 1;
                        this.update();
                    }

                    break;
                }
            }

            // eslint-disable-next-line no-fallthrough
            case this.back: {
                if (this.checkPerms()) {
                    await this.message.removeReaction(this.back, this.invoker.author.id);
                }

                if (this.page > 1) {
                    this.page--;
                    this.update();
                } else if (this.page === 1 && this.cycling === true) {
                    this.page = this.pages.length;
                    this.update();
                }

                break;
            }

            case this.forth: {
                if (this.checkPerms()) {
                    await this.message.removeReaction(this.forth, this.invoker.author.id);
                }

                if (this.page < this.pages.length) {
                    this.page++;
                    this.update();
                } else if (this.page === this.pages.length && this.cycling === true) {
                    this.page = 1;
                    this.update();
                }

                break;
            }

            case this.lastPage: {
                if (this.advanced) {
                    if (this.checkPerms()) {
                        await this.message.removeReaction(this.lastPage, this.invoker.author.id);
                    }

                    if (this.page < this.pages.length) {
                        this.page = this.pages.length;
                        this.update();
                    }

                    break;
                }

                break;
            }

            case this.delete: {
                if (this.advanced) {
                    return new Promise((resolve, reject) => {
                        if (this.checkPerms()) {
                            this.message.removeReactions().then(() => {
                                resolve();
                            });
                        } else {
                            reject(new Error('Insufficient permissions to remove reactions'));
                        }
                    });
                }

                break;
            }
            }
        });
    }
}

module.exports = {
    createPaginationEmbed: async (message, pages, options) => {
        const paginationEmbed = new PaginationEmbed(message, pages, options);
        await paginationEmbed.initialize();
        paginationEmbed.run();

        return Promise.resolve(paginationEmbed.message);
    }
};