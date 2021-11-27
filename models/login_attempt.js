"use strict";

var mongoose = require('mongoose'),
    utils = require("../utils.js"),
    Schema = mongoose.Schema;

var LoginAttemptSchema = new Schema({
  email:        {type: String, required: false},
  ip:           {type: String, required: false},
  attempts:     {type: Number},
  is_resolved:  {type: Boolean, default: false, required: false},
  last_attempt: { type: Date, default: Date.now}
});

//LoginAttemptSchema.pre('save', function preSave(next){
//  var attempt = this;
//  attempt.last_attempt(Date.now());
//  next();
//});

LoginAttemptSchema.pre('findOne', function(next) {
  this._conditions = utils.escapeRegExpQuery(this._conditions);
  next();
});

module.exports = mongoose.model('LoginAttempt', LoginAttemptSchema);
