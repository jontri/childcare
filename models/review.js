"use strict";

var mongoose = require('mongoose'),
    bcrypt = require("bcryptjs"),
    Schema = mongoose.Schema;

var ReviewSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    daycare_id: {type: String,required: true},
    reviewInfo : {
        avgRating: {type: Number,required: false},
        overAllRate: {type: Number,required: true},
        overAllComment: {type: String, required: false},
        safetyRate: {type: Number,required: false},
        safetyComment: {type: String,required: false},
        facilitiesRate: {type: Number,required: false},
        facilitiesComment: {type : String,required : false},
        staffRate: {type: Number,required: false},
        staffComment: {type: String,required: false},
        educationRate: {type: Number,required: false},
        educationComment: {type: String,required: false},
        //generalRate: {type: Number, required: false}, // TODO: declared but not used
        //generalComment: {type: String, required: false} // TODO: declared but not used
    },
    remarks : {type : String, required: true},
    dateSaved : {type : Date, required : true, default: Date.now},
    approved : {type : String, required : false, default : false},
    tags: { type: Array, required: false },
    history: { type: Array, required: false }
}, {
    toObject: {
        virtuals: true
    },
    toJSON: {
        virtuals: true
    }
});

module.exports = mongoose.model('Review', ReviewSchema);