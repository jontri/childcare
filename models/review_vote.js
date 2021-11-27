"use strict";

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ReviewVoteSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  review: {
    type: Schema.Types.ObjectId,
    ref: 'Review',
    required: true
  },
  vote: {
    type: String,
    enum: ['helpful', 'unhelpful', 'flagged'],
    required: true
  },
  date_requested: { type: Date, default: Date.now, required: true }
});

module.exports = mongoose.model('ReviewVote', ReviewVoteSchema);