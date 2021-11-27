"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var appointmentSchema = new Schema({
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {type: Date, required: true},
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
    required: true
  }
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
