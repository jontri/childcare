var path = require("path"),
    Review = require(path.join(__dirname, "..", "models", "review.js")),
    Listing = require(path.join(__dirname, "..", "models", "listing.js")),
    User = require(path.join(__dirname, "..", "models", "user.js")),
    mongoose_uri = process.env.MONGOOSE_URI || "localhost/databank";

console.log("Creating a new user in Mongo");

var mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.connect(mongoose_uri);

mongoose.connection.on('error', function () {
    console.log('Mongoose connection error', arguments);
});

mongoose.connection.once('open', function callback() {
    console.log("Mongoose connected to the database");

    username = "TestParent";

    var listingArray = [];
    var userArray = [];

    Listing.remove({name: new RegExp('Test Daycare')})
        .exec(function (err, listings) {
            if (!err) {

                User.remove({username: new RegExp('Test')})
                    .exec(function (err, users) {
                        if (!err) {

                            Review.remove({'reviewInfo.name': new RegExp('Test')})
                                .exec(function (err, users) {
                                    if (!err) {


                                    } else {
                                        return next(err);
                                    }
                                });

                        } else {
                            return next(err);
                        }
                    });
            } else {
                return next(err);
            }
        });



    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


});