"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ClassSchema = new Schema({
  listingId: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  providerId : {
    type: Schema.Types.ObjectId,
    required: true
  },
  name : {type: String},
  ageGroup: {
    min: {type: Number},
    minTime: {type: String},
    max: {type: Number},
    maxTime: {type: String}
  },
  capacityMax: {type: Number},
  capacityTaken: {type: Number},
  capacityVacant: {type: Number},
  teachers: [{
    type : Schema.Types.ObjectId,
    ref: 'Staff'
  }]
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Class', ClassSchema);
