var mongoose = require('mongoose');
mongoose.set('debug', true);
var connection = mongoose.connect("mongodb://127.0.0.1/databank");
var request = require('request');
var delay = require('delay');
var path = require("path"), Review = require(path.join(__dirname, "..", "models", "review.js")), Listing = require(path.join(__dirname, "..", "models", "listing.js"));
mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});

Listing.find({})
    .exec(function (err, listings) {
        if (!err) {

            console.log("List : " + listings.length);
            ctr=0;

            loopOnArrayWithDelay(listings, 210, 0, function (e, i) {

                ctr++;

                var listingId = listings[i]._id;

                // uncomment for this to work
                // Listing.update({_id:listingId}, {
                //     avgSafetyRatings: 0,
                //     avgFacilitiesRatings: 0,
                //     avgStaffRatings: 0,
                //     avgEducationRatings: 0,
                //     avgOverAllRatings: 0,
                //     totalReviews: 0
                // }, {upsert: true}, function (err, response) {
                //     if (err) {
                //         console.log("Error updating ratings " + err) ;
                //     } else {
                //         console.log("Updated Listing ID: " + listingId);
                //     }
                // });


            }, function (i) {
                console.log("Loop done");
            })


        } else {
            return next(err);
        }
    });





Review.remove({}, function (err, response) {
    if (err) {
        console.log("Error removing review " + err) ;
    } else {
        console.log("Removed all Reviews");
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
