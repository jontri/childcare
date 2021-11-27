"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ClientSchema = new Schema({

  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  daycareId: {
    type: Schema.Types.ObjectId,
    required: false
  },
  studentId: {
    type: Schema.Types.ObjectId,
    required: false
  },
  primaryGuardianId: {
    type: Schema.Types.ObjectId,
    required: false
  },
  secondaryGuardianId: {
    type: Schema.Types.ObjectId,
    required: false
  },
  noSecondary: {
    type: Boolean,
    required: true
  }

}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Client', ClientSchema);
