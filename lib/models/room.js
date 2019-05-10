'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');

var textSchema = new Schema({
    nickname: String,
    ts: Number,
    text: String
})

var roomSchema = new Schema({
    name       : {
        type     : String,
        required : true,
        unique   : true },
    password     : String,
    maxMembers   : Number,
    curMembers   : Number, //will maybe be removed
    members      : {
        type    : Object,
        default : {}
    },
    creator     : String, // user nickname
    lastWriter   : String, // user nickname
    numMessages : Number,
    text        : [textSchema]
});

function sha256(data) {
    return crypto.createHash("sha256").update(data).digest("base64");
}

roomSchema.methods.getText = function() {
    this.text.map(t => t.text).join(' ');
}

roomSchema.methods.generateHash = function(password) {
    return sha256(password);
};

roomSchema.methods.validPassword = function(password) {
    return sha256(password) === this.password;
};


var Room = mongoose.model('Room', roomSchema);

module.exports = Room;
