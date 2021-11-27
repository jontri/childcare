//# node insert_providers.js
var mongoose = require('mongoose');

var path = require("path");
mongoose.set('debug', true);
var mongoose_uri = "mongodb://ratingsville:r4tingsvill3@162.209.99.153:27017/databank?authSource=admin";
var connection =  mongoose.connect(mongoose_uri);
var request = require('request');
var geocoder = require('geocoder');

var Listing = require(path.join(__dirname, "..", "models", "listing.js"));

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});

var successCtr = 0;
var failedCtr = 0;

Listing.find({location : null }).limit(2000)
    .exec(function (err, listings) {
        if (!err) {

            console.log("List : " + listings.length);

            loopOnArrayWithDelay(listings, 1000, 0, function (e, i) {
                var address =
                    listings[i].address.city + ", " +
                    listings[i].address.state + " " +
                    listings[i].address.zip;

                if(listings[i].address.addressLine1){
                    address = listings[i].address.addressLine1 + " " + address;
                }

                if(listings[i].address.fullAddress){
                    address = listings[i].address.fullAddress;
                } else {
                    return;
                }


                var googleMapUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + address + "&key=AIzaSyDjFS85x86tcWrrl0ocwY_Tu_YEaEc-jzE";

                request({
                    uri: encodeURI(googleMapUrl),
                    method: "GET",
                    timeout: 10000,
                    followRedirect: true,
                    maxRedirects: 3
                }, function (error, response, body) {

                    var data = JSON.parse(body);

                    console.log("---  Get Lat Lng : " + listings[i].name + "  ---> " + encodeURI(googleMapUrl));

                    if (!error && response.statusCode == 200 && data.results && data.results.length > 0 ) {

                        listings[i].location = {
                                    type: "Point",
                                    coordinates: [data.results[0].geometry.location.lng, data.results[0].geometry.location.lat]
                                }

                                Listing.update({
                                        _id: listings[i]._id
                                    }, {
                                        $set: {
                                            'location': {
                                                type: "Point",
                                                coordinates: [data.results[0].geometry.location.lng, data.results[0].geometry.location.lat]
                                            }
                                        }
                                    },
                                    {
                                        upsert: true
                                    }, function (err, num) {
                                        if (err) {
                                            console.log("Error updating DB");
                                            failedCtr++;
                                            return next(err);
                                        } else {
                                            console.log("Updated record : " + listings[i].name);
                                            successCtr++;
                                        }
                                    });

                    } else {
                        console.log("Failed getLatLng -->  " + listings[i].name + "  ----  " + address);
                        failedCtr++;
                    }
                });

            }, function (i) {
                console.log("Processing done - Success:" + successCtr + " Failed: " + failedCtr);
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
