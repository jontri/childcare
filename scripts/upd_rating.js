//# node insert_providers.js
var mongoose = require('mongoose');

mongoose.set('debug', true);
var connection = mongoose.connect("mongodb://127.0.0.1/databank");
var request = require('request');
var delay = require('delay');
var geocoder = require('geocoder');
var path = require("path"),
    Review = require(path.join(__dirname, "..", "models", "review.js")),
    Listing = require(path.join(__dirname, "..", "models", "listing.js"));

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

                Review.aggregate([
                        {  $match: {
                            daycare_id: listingId,
                            approved: "true"
                        }},
                        { "$group": {
                            "_id": null,
                            "totalSafetyRate": { "$sum": "$reviewInfo.safetyRate" },
                            "totalFacilitiesRate": { "$sum": "$reviewInfo.facilitiesRate" },
                            "totalStaffRate": { "$sum": "$reviewInfo.staffRate" },
                            "totalEducationRate": { "$sum": "$reviewInfo.educationRate" },
                            "totalOverAllRate": { "$sum": "$reviewInfo.overAllRate" },
                            "totalAvgRating": { "$sum": "$reviewInfo.avgRating" },
                            "totalReviews": {"$sum": 1}
                        }}
                    ],
                    function(err, reviewSummary) {

                        console.log( ctr + " Review Summary:  " + JSON.stringify(reviewSummary));

                        var avgSafetyRatings = 0;
                        var avgFacilitiesRatings = 0;
                        var avgStaffRatings = 0;
                        var avgEducationRatings = 0;
                        var avgOverAllRatings = 0;

                        if(reviewSummary && reviewSummary.length > 0) {
                            var ratingSummary = reviewSummary[0];

                            if (err) {
                                throw(err);
                            } else {

                                avgSafetyRatings = parseFloat(ratingSummary.totalSafetyRate) / parseInt(ratingSummary.totalReviews);
                                avgFacilitiesRatings = parseFloat(ratingSummary.totalFacilitiesRate) / parseInt(ratingSummary.totalReviews);
                                avgStaffRatings = parseFloat(ratingSummary.totalStaffRate) / parseInt(ratingSummary.totalReviews);
                                avgEducationRatings = parseFloat(ratingSummary.totalEducationRate) / parseInt(ratingSummary.totalReviews);
                                avgOverAllRatings = parseFloat(ratingSummary.totalOverAllRate) / parseInt(ratingSummary.totalReviews);
                                totalReviews = parseInt(ratingSummary.totalReviews);

                                avgSafetyRatings = avgSafetyRatings.toFixed(2);
                                avgFacilitiesRatings = avgFacilitiesRatings.toFixed(2);
                                avgStaffRatings = avgStaffRatings.toFixed(2);
                                avgEducationRatings = avgEducationRatings.toFixed(2);
                                avgOverAllRatings = avgOverAllRatings.toFixed(2);

                                console.log("Safety: " + avgSafetyRatings);


                            }
                        } else {
                            console.log("No approved reviews");
                        }

                        Listing.update({
                            _id: listingId
                        }, {
                            avgSafetyRatings: avgSafetyRatings,
                            avgFacilitiesRatings: avgFacilitiesRatings,
                            avgStaffRatings: avgStaffRatings,
                            avgEducationRatings: avgEducationRatings,
                            avgOverAllRatings: avgOverAllRatings,
                            totalReviews: totalReviews
                        }, {
                            upsert: true
                        }, function (err, response) {
                            if (err) {
                                return next(err);
                            } else
                                console.log("Updated " + listingId + " " + JSON.stringify({
                                        avgSafetyRatings: avgSafetyRatings,
                                        avgFacilitiesRatings: avgFacilitiesRatings,
                                        avgStaffRatings: avgStaffRatings,
                                        avgEducationRatings: avgEducationRatings,
                                        avgOverAllRatings: avgOverAllRatings,
                                        totalReviews: totalReviews
                                    }));
                        });
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
