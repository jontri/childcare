var mongoose = require('mongoose');
mongoose.set('debug', true);
var connection = mongoose.connect("mongodb://127.0.0.1/databank");
var request = require('request');
var delay = require('delay');
var path = require("path");
//var Review = require(path.join(__dirname, "..", "models", "review.js"));var Listing = require(path.join(__dirname, "..", "models", "listing.js"));
var User = require(path.join(__dirname, "..", "models", "user.js"));

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});

//var condition = 

User.find({
        "favorites":{
            $elemMatch:{
                "listingId": {
                    $exists:false
                } 
            }
        }})
    .exec(function(err,users){
        console.log("Users with corrupted favorite: " + users.length);
        users.forEach( function(user){
            console.log("Updating user: " + user.firstName + user.lastName);

            User.update(
                {_id:user._id},
                { "$pull": { "favorites": { "listingId": null } } },
                {new: true},
                function(err,res){
                    if(err){
                        console.log("NOT UPDATED: " + user.firstName + user.lastName);
                    }else{
                        console.log("UPDATED: " + user.firstName + user.lastName);
                    }
                    
                });
        } );


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
