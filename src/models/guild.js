const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const guildSchema = new Schema({
    ID: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    modRoles: Array,
    prefix: String,
    modOnly: {
        type: Boolean,
        default: false
    },
    deleteModCommands: {
        type: Boolean,
        default: false
    },
    dmUsers: {
        type: Boolean,
        default: true
    },
    modLogChannel: String,
    moderationCases: [
        {
            userID: String,
            actionType: String,
            moderator: String,
            reason: String,
            caseID: Number,
            date: Date
        }
    ],
    mute: {
        roleID: String,
        users: [
            {
                ID: String,
                expirationDate: String
            }
        ]
    },
    logging: {
        channelID: String,
        ignoredChannels: Array,
        types: {
            type: Array,
            default: [
                'Channel Created', 'Channel Deleted', 'Channel Updated', 'Member Joined', 'Member Left', 'Member Kicked', 'Member Banned', 'Member Unbanned', 'Bot Added', 'Role Created', 
                'Role Deleted', 'Invite Created', 'Emoji Created', 'Message Edited', 'Message Deleted', 'Nickname Changed', 'Messages Bulk Deleted', 'Member Roles Changed'
            ]
        }
    },
    reactionRoles: [
        {
            channelID: String,
            messageID: String,
            emoji: String,
            roleID: String
        }
    ],
    linkedChannels: Array,
    premium: Boolean,
    premiumUserID: String
});

module.exports = mongoose.model('Guild', guildSchema);