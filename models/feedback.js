"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var FeedbackSchema = new Schema({
  user_id: {type: String,required: true},
  name: {type: String,required: true},
  email: {type: String,required: true},
  feedback: {type: String,required: true},
  date: {type: Date, required: true, default: Date.now},
  status : {type: String,required: true,default:'pending'}
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);