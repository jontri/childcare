"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ArticlesSchema = new Schema({
  user_id:      {type: String, required: false},
  title:      {type: String, required: false},
  content:      {type: String, required: true},
  tags:         {type: Array, required: false},
  main_img:    {type: String, required: false}
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Articles', ArticlesSchema);
