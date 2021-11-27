var path = require("path"),
    Review = require(path.join(__dirname, "..", "models", "review.js")),
    Listing = require(path.join(__dirname, "..", "models", "listing.js")),
    LoginAttempt = require(path.join(__dirname, "..", "models", "login_attempt.js")),
    User = require(path.join(__dirname, "..", "models", "user.js")),
    mongoose_uri = process.env.MONGOOSE_URI || "localhost/databank";

var username = 'admin@ratingsville.com';
console.log("Clearing Login Attempt");

var mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.connect(mongoose_uri);

mongoose.connection.on('error', function () {
    console.log('Mongoose connection error', arguments);
});

mongoose.connection.once('open', function callback() {
    console.log("Mongoose connected to the database");


    LoginAttempt.remove({email:username })
        .exec(function (err, attempts) {
            if (!err) {
                console.log("Successfuly unlocked: " + username);
            } else {
                return next(err);
            }
        });



});