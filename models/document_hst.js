"use strict";

var mongoose = require('mongoose'),
    utils = require("../utils.js"),
    Schema = mongoose.Schema;

var DocumentHstSchema = new Schema({

  type: { type: String, required: true },
  userId: {type: Schema.Types.ObjectId,required: true},
  studentId: {type: Schema.Types.ObjectId, ref: 'Student', required: true},

  // Generated Pdf file Path and date modified
  pdfPath: { type: String, required: false },
  pdfDate: { type: Date, required: false },
  version: { type: Number, required: false, default:0 }

}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});


module.exports = mongoose.model('DocumentHst', DocumentHstSchema);
