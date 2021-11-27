"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var InviteSchema = new Schema({
  user_id: {type: String,required: false},
  name: {type: String,required: false},
  email: {type: String,required: true},
  recipient: {type: String,required: true},
  message: {type: String,required: true},
  date: {type: Date, required: true, default: Date.now},
  status : {type: String,required: true,default:'pending'}
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Invite', InviteSchema);