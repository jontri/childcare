"use strict";

var mongoose = require('mongoose'),
    bcrypt = require("bcryptjs"),
    utils = require("../utils.js"),
    Schema = mongoose.Schema;

var DocumentSchema = new Schema({

  // NOTE: If adding new fields, always check CORE DATA if its already declared

  // CORE DATA
  type: { type: String, required: true },
  userId: {type: Schema.Types.ObjectId,required: true},
  studentId: {type: Schema.Types.ObjectId, ref: 'Student', required: true},
  firstName: { type: String, required: false },
  middleName: { type: String, required: false },
  lastName: { type: String, required: false },
  birth: { type: Date, required: false },
  nickName: { type: String, required: false },
  age: { type: Number, required: false },
  gender: { type: String, required: false },
  pobox: { type: String, required: false },
  street: { type: String, required: false },
  apt: { type: String, required: false },
  zip: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  motherName: { type: String, required: false },
  motherAddress: { type: String, required: false },
  motherCity: { type: String, required: false },
  motherState: { type: String, required: false },
  motherHomeNum: { type: String, required: false },
  motherWorkNum: { type: String, required: false },
  motherMobileNum: { type: String, required: false },
  motherEmployer: { type: String, required: false },
  motherEmployerAddress: { type: String, required: false },
  fatherName: { type: String, required: false },
  fatherAddress: { type: String, required: false },
  fatherCity: { type: String, required: false },
  fatherState: { type: String, required: false },
  fatherHomeNum: { type: String, required: false },
  fatherWorkNum: { type: String, required: false },
  fatherMobileNum: { type: String, required: false },
  fatherEmployer: { type: String, required: false },
  fatherEmployerAddress: { type: String, required: false },
  doctor: {type: Schema.Types.Mixed, required: false},
  contact: {type: Schema.Types.Mixed, required: false},
  medicalPermission: { type: String, required: false },
  note: { type: String, required: false },
  medicalData: {type: Schema.Types.Mixed, required: false},
  dateSaved : {type : Date, required : true, default: new Date().toLocaleString()},

  // SPECIAL FORMS DATA: data that is not categorized in CORE DATA

  // ENROLLMENT DATA
  custody: { type: String, required: false },
  careHourStart: { type: String, required: false },
  careHourEnd: { type: String, required: false },
  careDay:  {type: Schema.Types.Mixed, required: false},
  careMeal: {type: Schema.Types.Mixed, required: false},
  liveWith: { type: String, required: false },
  liveWithOther: { type: String, required: false },
  hospital: { type: String, required: false },

  // Generated Pdf file Path and date modified
  pdfPath: { type: String, required: false },
  pdfDate: { type: Date, required: false },
  version: { type: Number, required: false, default:0 },
  recipientEmail: { type: String, required: false },
  providerEmail: { type: String, required: false }

}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});


module.exports = mongoose.model('Document', DocumentSchema);
