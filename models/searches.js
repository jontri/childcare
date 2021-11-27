	/*
		Search criteria collection
		userId
		dateSearched
		criterias
			Age
			Coverage
			Service options
			Cost
			Rating
			Features
	*/
	"use strict";
	var mongoose         = require('mongoose'),
		Schema           = mongoose.Schema,
		ObjectId         = Schema.ObjectId,
		mongoosePaginate = require('mongoose-paginate');
	var SearchesSchema   = new Schema({
		userId           : {type:String},
		keyword	         : {type:String},
		location         : {type:String},
		zip          	 : {type:String},
		county           : {type:String},
		within           : {type:String},
		fullAddress      : {type:String},
		searchDate       : {type:Date , default:Date.now},
		is_saved         : {type:Boolean},
		saveTitle        : {type:String},
		/*limit            : {type:String},
		skip             : {type:String},
		sortBy           : {type:String},
		sortOrder        : {type:String},
		
		keyword          : {type:String},
		city             : {type:String},
		zip              : {type:String},
		fullAddress      : {type:String},
		county           : {type:String},
		// Numeric Filters
		age              : [{type:Number}],
		rating           : [{type:Number}],
		cost             : [{type:String}],
		// Features
		faithbased       : {type:String},
		accredited       : {type:String},
		headstart        : {type:String},
		goldSeal         : {type:String},
  		vpk              : {type:String},
  		schoolReadiness  : {type:String},
		// Services
		dropins          : {type:String},
		beforeschool     : {type:String},
		afterschool      : {type:String},
		meals            : {type:String},
		transportation   : {type:String},
		// Coverage
		schoolyearonly   : {type:String},
		weekend          : {type:String},
		halfday          : {type:String},
		nightcare        : {type:String},*/
		queryJson        : {type:String}
	}, {
	  toObject           : {
		virtuals         : true
	  }, toJSON          : {
		virtuals         : true
	  }
	});
	SearchesSchema.plugin(mongoosePaginate);
	module.exports       = mongoose.model('Searches', SearchesSchema);
