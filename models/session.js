"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var Session = new Schema({
  sessionId: {type:String, required:true, unique:true},
  userId: {type:String, required:true},
  userType: {type:String, required:true}
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Session', Session);
