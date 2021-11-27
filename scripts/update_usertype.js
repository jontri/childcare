var path = require("path"),
    Review = require(path.join(__dirname, "..", "models", "review.js")),
    Listing = require(path.join(__dirname, "..", "models", "listing.js")),
    LoginAttempt = require(path.join(__dirname, "..", "models", "login_attempt.js")),
    User = require(path.join(__dirname, "..", "models", "user.js")),
    mongoose_uri = process.env.MONGOOSE_URI || "localhost/databank";

var username = 'system@ratingsville.com';
console.log("Clearing Login Attempt");

var mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.connect(mongoose_uri);

mongoose.connection.on('error', function () {
    console.log('Mongoose connection error', arguments);
});

mongoose.connection.once('open', function callback() {
    console.log("Mongoose connected to the database");


    User.update({
        username: username
    }, {
        userType: "admin",
        status: "active"
    }, {
        upsert: true
    }, function (err, response) {
        if (err) {
            return next(err);
        }
    });


});