"use strict";

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var AddressSchema = new Schema({

  addressLine1: {type: String, required: false},
  addressLine2: {type: String, required: false},
  city: {type: String, required: false},
  state: {type: String, required: false},
  zip: {type: String, required: false},
  zip4: {type: String, required: false},
  fullAddress: {type: String, required: false}
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Address', AddressSchema);
