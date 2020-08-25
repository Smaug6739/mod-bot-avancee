const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const user = new Schema({
    ID: {
        type: String,
        required: true
    },
    points: Number
});
module.exports = mongoose.model('DBLUser', user);