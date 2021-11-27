"use strict";

var mongoose = require('mongoose'),
    bcrypt = require("bcryptjs"),
    Schema = mongoose.Schema;

var MessageSchema = new Schema({
  subject:      {type: String, required: false},
  message:      {type: String, required: true},
  email:        {type: String, required: false},
  sender_id:    {type: Schema.Types.ObjectId, ref: 'User', required: false},
  recipient_id: {type: Schema.Types.ObjectId, ref: 'User', required: false},
  listing_id:   {type: String, required: false},
  review_id:    {type: String, required: false},
  status:       {type: String, required: false},
  date:         {type: Date, required: true, default: Date.now}
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

MessageSchema.pre('save', function(next) {
  this.date = new Date();
  next();
});

MessageSchema.pre('update', function(next) {
  this.date = new Date();
  next();
});

module.exports = mongoose.model('Message', MessageSchema);
