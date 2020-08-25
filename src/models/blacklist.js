const mongoose = require('mongoose');
const { Schema } = mongoose;
const blacklist = new Schema({
    ID: {
        type: String, 
        required: true
    },
    type: {
        type: String,
        required: true
    },
    blacklisted: { 
        type: Boolean, 
        default: true 
    }
});

module.exports = mongoose.model('Blacklist', blacklist);