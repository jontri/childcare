//# node insert_providers.js
var mongoose = require('mongoose');

mongoose.set('debug', true);
var connection = mongoose.connect("mongodb://127.0.0.1/databank");
var request = require('request');
var delay = require('delay');
var geocoder = require('geocoder');
var Promise = require('promise');
var promiseDelay = require('promise-delay')

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});

Schema = mongoose.Schema;

var ListingSchema = new Schema({

    code: {type: String, required: false},
    name: {type: String, required: true},
    description: {type: String, required: false},
    type: {type: String, required: false},
    website: {type: String, required: false},
    email: {type: String, required: false},
    administrator: {type: String, required: false},
    contact: {type: String, required: false},
    fax: {type: String, required: false},
    phone: {type: String, required: false},
    altPhone: {type: String, required: false},
    primaryContact: {
        title: {type: String, required: false},
        firstName: {type: String, required: false},
        lastName: {type: String, required: false},
    },
    altContact: {
        title: {type: String, required: false},
        firstName: {type: String, required: false},
        lastName: {type: String, required: false},
    },
    address: {
        addressLine1: {type: String, required: false},
        addressLine2: {type: String, required: false},
        city: {type: String, required: false},
        state: {type: String, required: false},
        zip: {type: String, required: false},
        cityState: {type: String, required: false},
        cityStateLong: {type: String, required: false}
    },
    license: {
        legalStatus: {type: String, required: false},
        legalId: {type: String, required: false},
        startDate: {type: Date, required: false, default: Date.now},
        endDate: {type: Date, required: false, default: Date.now}
    },
    ageLimit: {
        minAge: {type: Number, required: false},
        maxAge: {type: Number, required: false},
        minAgeUnit: {type: String, required: false},
        maxAgeUnit: {type: String, required: false}
    },
    openHours: {
        sunday: {type: String, required: false, default: "N"},
        monday: {type: String, required: false, default: "N"},
        tuesday: {type: String, required: false, default: "N"},
        wednesday: {type: String, required: false, default: "N"},
        thursday: {type: String, required: false, default: "N"},
        friday: {type: String, required: false, default: "N"},
        saturday: {type: String, required: false, default: "N"},
        openTime: {type: String, required: false},
        closeTime: {type: String, required: false}
    },
    providerType: {type: String, required: false},
    status: {type: String, required: false},
    longitude: {type: String, required: false},
    latitude: {type: String, required: false},
    loc: {
        x: {type: Number, required: false},
        y: {type: Number, required: false}
    }
}, {
    toObject: {
        virtuals: true
    }, toJSON: {
        virtuals: true
    }
});
var ReviewSchema = new Schema({
    user_id: {type: String,required: true},
    daycare_id: {type: String,required: true},
    reviewInfo : {
        name: {type: String,required: false},
        avgRating: {type: Number,required: true},
        safetyRate: {type: Number,required: true},
        safetyComment: {type: String,required: true},
        facilitiesRate: {type: Number,required: true},
        facilitiesComment: {type : String,required : true},
        staffRate: {type: Number,required: true},
        staffComment: {type: String,required: true},
        educationRate: {type: Number,required: true},
        educationComment: {type: String,required: true},
        general: {type: String, required: false}
    },
    photo: {type: String, required: false},
    remarks : {type : String, required: true},
    dateSaved : {type : String, required : true},
    approved : {type : String, required : false},
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

var Review = connection.model('Review', ReviewSchema);
var Listing = connection.model('Listing', ListingSchema);

// uncomment for this to work
// Review.remove({  }, function(err,result) {
//     if (err) {
//         next(err);
//     } else {
//         console.log("Successful removing reviews");
//     }
// });

// Listing.remove({  }, function(err,result) {
//     if (err) {
//         next(err);
//     } else {
//         console.log("Successful removing listing");
//     }
// });

