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
    }
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

            loopOnArrayWithDelay(listings, 210, 0, function (e, i) {
                var address =
                    listings[i].address.city + ", " +
                    listings[i].address.state + " " +
                    listings[i].address.zip;

                if(listings[i].address.addressLine1){
                    address = listings[i].address.addressLine1 + " " + address;
                }

                listings[i].address.cityState = listings[i].address.city + ", " + listings[i].address.state;
                listings[i].address.fullAddress = address.toUpperCase();

                Listing.update({
                    _id: listings[i]._id
                }, {$set:{ 'address.cityState':listings[i].address.cityState ,
                            'address.fullAddress':listings[i].address.fullAddress}}, {
                    upsert: true
                }, function (err, num) {
                    if (err) {
                        return next(err);
                    }
                });


            }, function (i) {
                console.log("Loop done");
            })


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
