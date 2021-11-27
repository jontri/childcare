"use strict";

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var OwnerRequestSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  date_requested: { type: Date, default: Date.now, required: true },
  modify_date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true
  },
  id_doc: { type: String, required: false },
  id_doc_sufficient: { type: Boolean, required: false },
  proof_owner_doc: { type: String, required: false },
  proof_owner_doc_sufficient: { type: Boolean, required: false },
  power_attorney_doc: { type: String, required: false },
  power_attorney_doc_sufficient: { type: Boolean, required: false },
  proof_owner: { type: Boolean, required: false },
  day7: { type: Number, required: false },
  day12: { type: Number, required: false },
  day13: { type: Number, required: false },
  day14: { type: Number, required: false }
});

OwnerRequestSchema.pre('save', function(next) {
  this.modify_date = Date.now();
  next();
});

OwnerRequestSchema.pre('update', function(next) {
  this.modify_date = Date.now();
  next();
});

OwnerRequestSchema.index({owner: -1, listing: -1}, {unique: true});

module.exports = mongoose.model('OwnerRequest', OwnerRequestSchema);