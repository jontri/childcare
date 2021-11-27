"use strict";

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var CurriculumSchema = new Schema({
  description: {
    type: String,
    required: true
  },
  origin: {
    type: String,
    enum: ['db', 'ui'],
    required: true
  },
  publisher: {
    type: String
  }
});

module.exports = mongoose.model('Curriculum', CurriculumSchema);