"use strict";

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var AccreditationSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  goldSeal: {
    type: Boolean,
    required: true,
    default: false
  },
  vpk: {
    type: Boolean,
    required: true,
    default: false
  },
  origin: {
    type: String,
    enum: ['db', 'ui'],
    required: true
  }
});

module.exports = mongoose.model('Accreditation', AccreditationSchema);