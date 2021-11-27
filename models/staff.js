"use strict";

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StaffSchema = new Schema({
  listingId : {type: Schema.Types.ObjectId,required: true},
  firstName : {type: String, required: true},
  lastName : {type: String, required: true},
  midInitial : {type: String, required: false},
  role : {type: String, required: false},
  birth : {type: Date, required: true},
  ss : {type: String, required: true},
  state : {type: String, required: true},
  city : {type: String, required: true},
  street : {type: String, required: true},
  apt : {type: String, required: false},
  pobox : {type: String, required: false},
  zip : {type: String, required: true},
  mobileNumber: {type: String, required: false},
  homeNumber : {type: String, required: false},
  workNumber : {type: String, required: false},
  email : {type: String, required: false},
  address: { type: Schema.Types.Mixed, required: false },
  employmentStart : {type: Date, required: false},
  employmentEnd : {type: Date, required: false},
  employmentHistory : [
    { name: { type:String,required: false }, 
      address: { 
        suite: {type: String, required: false},
        pobox: {type: String, required: false},
        city: {type: String, required: false},
        state: {type: String, required: false},
        street: {type: String, required: false},
        zip: {type: String, required: false}
      }, 
      phoneNumber: { type:String,required: false }, 
      contactFirstName: { type:String,required: false },
      contactMidInitial: { type:String,required: false },
      contactLastName: { type:String,required: false },
      contactEmail: {type: String, required: false},
      employmentStart : { type:Date,required: false },
      employmentEnd : { type:Date,required: false },
      endingCompensation : { type:Number,required: false },
      reason : { type:String,required: false },
      authorizeContact : { type:Boolean,required: false }
    }
  ],
  reference : [
    { firstName: { type:String,required: false }, 
      midInitial: { type:String,required: false }, 
      lastName: { type:String,required: false }, 
      phoneNumber: { type:String,required: false }, 
      email: { type:String,required: false } 
    }
  ]

}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

module.exports = mongoose.model('Staff', StaffSchema);

