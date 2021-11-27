var path = require("path"),
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

    // Parent
    username = "TestParent";
    for(i=0; i<30; i++){

        var user = new User();

        user.username = username + i;
        user.password = password;
        user.firstName = "Test" + i;
        user.lastName = "User";
        user.address = {};
        user.address.state = "FL";
        user.address.city = "Orlando";
        user.address.street = "1825 Anna Catherine Drive";
        user.address.zip = "32828";
        user.contactNum = "8482197734";
        user.userType = 'parent';
        user.email = username + i + "@ratingsville.com";
        user.security_question = {
            "question1" : null,
            "question2" : null,
            "question3" : null,
            "answer1" : null,
            "answer2" : null,
            "answer3" : null
        };
        user.status = "active";
        user.phone_number_verified = "true";

        user.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log(user);
            }
        });
    }

    username = "TestProvider";
    // Provider
    for(i=0; i<10; i++){

        var user = new User();

        user.username = username + i;
        user.password = password;
        user.firstName = "Test" + i;
        user.lastName = "User";
        user.address = {};
        user.address.state = "FL";
        user.address.city = "Orlando";
        user.address.street = "1825 Anna Catherine Drive";
        user.address.zip = "32828";
        user.contactNum = "8482197734";
        user.userType = 'provider';
        user.email = username + i + "@ratingsville.com";
        user.security_question = {
            "question1" : null,
            "question2" : null,
            "question3" : null,
            "answer1" : null,
            "answer2" : null,
            "answer3" : null
        };
        user.status = "active";
        user.phone_number_verified = "true";

        user.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log(user);
            }
        });
    }

    username = "TestMulti";
    // Provider + Parent
    for(i=0; i<10; i++){

        var user = new User();

        user.username = username + i;
        user.password = password;
        user.firstName = "Test" + i;
        user.lastName = "User";
        user.address = {};
        user.address.state = "FL";
        user.address.city = "Orlando";
        user.address.street = "1825 Anna Catherine Drive";
        user.address.zip = "32828";
        user.contactNum = "8482197734";
        user.userType = ['provider','parent'];
        user.email = username + i + "@ratingsville.com";
        user.security_question = {
            "question1" : null,
            "question2" : null,
            "question3" : null,
            "answer1" : null,
            "answer2" : null,
            "answer3" : null
        };
        user.status = "active";
        user.phone_number_verified = "true";

        user.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log(user);
            }
        });
    }

});