"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var BroadcastSchema = new Schema({
  type:         {type: String, required: true},  // alert, information
  content:      {type: String, required: false},
  active:       {type: Boolean, required: true, default: true}
  
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Broadcast', BroadcastSchema);
