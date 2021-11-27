
var mongoose = require('mongoose');

mongoose.set('debug', true);

var mongoose_uri = "mongodb://ratingsville:r4tingsvill3@localhost:27017/databank?authSource=admin";
var connection =  mongoose.connect(mongoose_uri);

var path = require("path");
var Listing = require(path.join(__dirname, "..", "models", "listing.js"));

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});

// add criteria for FL state only
Listing.update({imported:'Y', status:'active', importDate: null, managed: null}, {$set: {'status': 'inactive'}}, {upsert: false, multi: true}, function (err, num) {
    if (err) {
        console.log("Error updating " + err);
    } else {
        console.log("Success in update " + JSON.stringify(num));
    }
});


