"use strict";

var mongoose = require('mongoose'),
    bcrypt = require("bcryptjs"),
    Schema = mongoose.Schema;

var NotificationSchema = new Schema({
  user_id:      {type: String, required: false},
  type:         {type: String, required: false},
  content:      {type: String, required: true},
  is_read:      {type: Boolean, required: true},
  is_opened:      {type: Boolean, required: true}
  
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);
