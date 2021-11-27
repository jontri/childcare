"use strict";

var mongoose = require('mongoose'),
    bcrypt = require("bcryptjs"),
    Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;
	

var StudentSchema = new Schema({

  /*parent_id: ObjectId,
  class_id: ObjectId,
  provider_id: ObjectId,
  name:String,
  age:Number,
  gender:String*/

  clientId: {type: Schema.Types.ObjectId,required: true},
  primaryGuardianId: { type: Schema.Types.ObjectId, required: false },
  secondaryGuardianId: { type: Schema.Types.ObjectId,required: false },
  firstName:{type: String, required: true},
  lastName:{type: String, required: true},
  middleInitial:{type: String, required: false},
  gender:{type: String, required: false},
  birth:{type: Date, required: true},
  age:{type: String, required: true},

  mailing_address:{
    apt: {type: String, required: false},
    pobox: {type: String, required: false},
    city: {type: String, required: false},
    state: {type: String, required: false},
    street: {type: String, required: false},
    zip: {type: String, required: false},
  },
  
  pediatrician: {
      firstName: {type: String, required: false},
      lastName: {type: String, required: false},
      middleInitial: {type: String, required: false},
      work_address: {
        suite: {type: String, required: false},
        pobox: {type: String, required: false},
        city: {type: String, required: false},
        state: {type: String, required: false},
        street: {type: String, required: false},
        zip: {type: String, required: false}
      },
      officeName: {type: String, required: false},
      workNum: {type: String, required: false},
  },

  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
  }
  

}, {
  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});


module.exports = mongoose.model('Student', StudentSchema);
