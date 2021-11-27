"use strict";

var mongoose = require('mongoose'),
    bcrypt = require("bcryptjs"),
    utils = require("../utils.js"),
    Schema = mongoose.Schema;


var PasswordResetSchema = new Schema({

  email:            {type: String, required: true},
  token:            {type: String, required: true},
  has_expired:      {type: Boolean, required: true},
  modify_date:      {type: Date, default: Date.now}

}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

//PasswordResetSchema.pre('save', function(next) {
//    var reset_request = this;
//
//    bcrypt.genSalt(10, function(err, salt) {
//        if (err) { return next(err); }
//
//        bcrypt.hash(reset_request.token, salt, function(err, hash) {
//            if (err) {return next(err); }
//
//            reset_request.token = hash;
//            next();
//        });
//    });
//});

PasswordResetSchema.methods.compareToken = function(candidateToken, callback) {
    bcrypt.compare(candidateToken, this.token, function(err, isMatch) {
        if (err) { return callback(err); }
        callback(null, isMatch);
    });
}

PasswordResetSchema.pre('findOne', function(next) {
  this._conditions = utils.escapeRegExpQuery(this._conditions);
  next();
});

PasswordResetSchema.pre('update', function(next) {
  this._conditions = utils.escapeRegExpQuery(this._conditions);
  next();
});

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);
