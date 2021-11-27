"use strict";

var mongoose = require('mongoose'),
    utils = require("../utils.js"),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');

var AuditLogSchema = new Schema({
	ip_address:		{type: String, required: true},
	email:			{type: String, required: false},
	create_date:	{type: Date, default: Date.now},
	url_visited:	{type: String, required: true},
	visit_counter:	{type:Number, required: true},
	visit_date:		{type: Date, default: Date.now}
}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

AuditLogSchema.plugin(mongoosePaginate);

AuditLogSchema.pre('find', function(next) {
  this._conditions = utils.escapeRegExpQuery(this._conditions);
  next();
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
