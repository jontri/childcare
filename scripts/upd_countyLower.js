//# node insert_providers.js
var mongoose = require('mongoose');

mongoose.set('debug', true);
var connection = mongoose.connect("mongodb://127.0.0.1/databank");
var request = require('request');
var delay = require('delay');
var geocoder = require('geocoder');
var path = require("path"),
    Listing = require(path.join(__dirname, "..", "models", "listing.js"));

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});



Listing.find({}).exec(function (err, listings) {
    if (!err) {
        console.log("List : " + listings.length);
        loopOnArrayWithDelay(listings, 210, 0, function (e, i) {
            var lowerCounty = listings[i].address.county.toLowerCase();
            Listing.update({_id: listings[i]._id}, {$set: {'address.county': lowerCounty}}, {upsert: true}, function (err, num) {
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
