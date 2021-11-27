"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GuardianSchema = new Schema({
  clientId: {type: Schema.Types.ObjectId,required: true},

  // profile
  type: {type: String, required: true},
  relationship: {type: String, required: true},
  relationshipOther: {type: String, required: false},
  custody: {type: String, required: true},
  firstName: {type: String, required: true},
  lastName: {type: String, required: true},
  middleInitial: {type: String, required: false},
  birth: {type: Date, required: false},
  employer: {type: String, required: false},
  age: {type: String, required: false},

  // contact info
  email: {type: String, required: true},
  mailing_address: {
    apt: {type: String, required: false},
    pobox: {type: String, required: false},
    city: {type: String, required: true},
    state: {type: String, required: true},
    street: {type: String, required: true},
    zip: {type: String, required: true},
  },
  work_address: {
    suite: {type: String, required: false},
    pobox: {type: String, required: false},
    city: {type: String, required: false},
    state: {type: String, required: false},
    street: {type: String, required: false},
    zip: {type: String, required: false},
  },
  sameAsHome: {type: Boolean, required: false, default: false},
  sameAsPrimary: {type: Boolean, required: false, default: false},
  emergencyContact: {type: String, required: true, default: 'Y'},
  contactNum: {type: String, required: false},
  mobileNum: {type: String, required: true},
  workNum: {type: String, required: false},
  state: {type: String, required: false}

}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Guardian', GuardianSchema);
