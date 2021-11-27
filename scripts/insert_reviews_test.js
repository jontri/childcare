var path = require("path"),
    Review = require(path.join(__dirname, "..", "models", "review.js")),
    Listing = require(path.join(__dirname, "..", "models", "listing.js")),
    User = require(path.join(__dirname, "..", "models", "user.js")),
    mongoose_uri = process.env.MONGOOSE_URI || "localhost/databank";

var username = "TestParent";
var password = "Pa55w0rd*";

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

    Listing.find({name: new RegExp('Test Daycare')})
        .exec(function (err, listings) {
            if (!err) {

                User.find({username: new RegExp('TestParent')})
                    .exec(function (err, users) {
                        if (!err) {


                            for (var i = 0; i < listings.length; i++) {

                                var avgSafetyRate  = 0;
                                var avgFacilitiesRate = 0;
                                var avgStaffRate = 0;
                                var avgEducationRate = 0;
                                var avgOverAllRate = 0;

                                for (var x = 0; x < users.length; x++) {

                                    var review = new Review();

                                    review.user_id = users[x]._id;
                                    review.daycare_id = listings[i]._id;
                                    review.approved = "true";
                                    review.remarks = "complete";
                                    review.reviewInfo = {};
                                    review.reviewInfo.safetyRate = getRandomInt(1,5);
                                    review.reviewInfo.facilitiesRate = getRandomInt(1,5);
                                    review.reviewInfo.staffRate = getRandomInt(1,5);
                                    review.reviewInfo.educationRate = getRandomInt(1,5);
                                    review.reviewInfo.overAllRate = getRandomInt(1,5);
                                    review.reviewInfo.safetyComment = "Safety Comment";
                                    review.reviewInfo.facilitiesComment = "Facilities Comment";
                                    review.reviewInfo.staffComment = "Staff Comment";
                                    review.reviewInfo.educationComment = "Education Comment";
                                    review.reviewInfo.overAllComment = "Overall Comment";
                                    review.reviewInfo.name = users[x].firstName + " " + users[x].lastName.substr(0,1) + ".";


                                    avgSafetyRate  += review.reviewInfo.safetyRate;
                                    avgFacilitiesRate += review.reviewInfo.facilitiesRate;
                                    avgStaffRate += review.reviewInfo.staffRate;
                                    avgEducationRate += review.reviewInfo.educationRate;
                                    avgOverAllRate += review.reviewInfo.overAllRate;

                                    console.log("Inserting Review To:  " + listings[i].name + " By: " + users[x].username);

                                    review.save(function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {

                                        }
                                    });
                                }

                                listings[i].avgSafetyRatings = avgSafetyRate / users.length;
                                listings[i].avgFacilitiesRatings = avgFacilitiesRate / users.length;
                                listings[i].avgEducationRatings = avgEducationRate / users.length;
                                listings[i].avgStaffRatings = avgStaffRate / users.length;
                                listings[i].avgOverAllRatings = avgOverAllRate / users.length;
                                listings[i].totalReviews = users.length;

                                listings[i].save(function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {

                                    }
                                });
                            }

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