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
        fullAddress: {type: String, required: false}
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
    },
    cost:{type:String,required:false},
    faithbased:{type:String,required:false},
    accredited:{type:String,required:false},
    headstart:{type:String,required:false},
    weekend:{type:String,required:false},
    nightcare:{type:String,required:false},
    halfday:{type:String,required:false},
    schoolyearonly:{type:String,required:false},
    infantcare:{type:String,required:false},
    dropins:{type:String,required:false},
    beforeschool:{type:String,required:false},
    afterschool:{type:String,required:false},
    meals:{type:String,required:false},
    transportation:{type:String,required:false},
    overAllRatings:{type:String,required:false},
    goldSeal:{type:String,required:false},
    vpk:{type:String,required:false},
    schoolReadiness:{type:String,required:false}
}, {
    toObject: {
        virtuals: true
    }, toJSON: {
        virtuals: true
    }
});

var Listing = connection.model('Listing', ListingSchema);


Listing.find({})
    .exec(function (err, listings) {
        if (!err) {

            console.log("List : " + listings.length);
            ctr=0;

            // uncomment this to work
            // loopOnZipCodeListWithDelay(listings, 210, 0, function (e, i) {
            //
            //     ctr++;
            //
            //     var address = listings[i].address.addressLine1 + " " +
            //         listings[i].address.city + ", " +
            //         listings[i].address.state + " " +
            //         listings[i].address.zip;
            //
            //     if(ctr % 2 == 0 ){
            //
            //         Listing.update({
            //             _id: listings[i]._id
            //         }, {$set:{ 'weekend':'Y',
            //             'dropins':'Y',
            //             'afterschool':'Y',
            //             'infantcare':'Y',
            //             'transportation':'Y',
            //             'overAllRatings':2,
            //             'cost':'$$',
            //             'accredited':'Y',
            //             'halfday':'Y',
            //             'goldSeal': 'Y',
            //             'schoolyearonly':'Y',}}, {
            //             upsert: true
            //         }, function (err, num) {
            //             if (err) {
            //                 return next(err);
            //             }
            //         });
            //
            //     }
            //
            //     if(ctr % 3 == 0 ){
            //
            //         Listing.update({
            //             _id: listings[i]._id
            //         }, {$set:{ 'beforeschool':'Y' ,
            //             'meals':'Y',
            //             'overAllRatings':1,
            //             'cost':'$$$',
            //             'nightcare':'Y',
            //             'faithbased':'Y',
            //             'vpk':'Y',
            //             'headstart':'Y'}}, {
            //             upsert: true
            //         }, function (err, num) {
            //             if (err) {
            //                 return next(err);
            //             }
            //         });
            //
            //     }
            //
            //     if(ctr % 5 == 0 ){
            //
            //         Listing.update({
            //             _id: listings[i]._id
            //         }, {$set:{ 'overAllRatings':4,
            //             'cost':'$$$$$',
            //             'transportation':'Y',
            //             'schoolReadiness':'Y',
            //             'halfday':'Y'}}, {
            //             upsert: true
            //         }, function (err, num) {
            //             if (err) {
            //                 return next(err);
            //             }
            //         });
            //
            //     }
            //
            //
            // }, function (i) {
            //     console.log("Loop done");
            // })


        } else {
            return next(err);
        }
    });




function loopOnArrayWithDelay(theArray, delayAmount, i, theFunction, onComplete) {

    if (i < theArray.length && typeof delayAmount == 'number') {

        //console.log("i " + i);

        theFunction(theArray[i], i);

        setTimeout(function () {

            loopOnArrayWithDelay(theArray, delayAmount, (i + 1), theFunction, onComplete)
        }, delayAmount);
    } else {

        onComplete(i);
    }
}
