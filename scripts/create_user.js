//# node create_user.js jorzi@yahoo.com owner

var path = require("path"),
    User = require(path.join(__dirname, "..", "models", "user.js")),
    mongoose_uri = process.env.MONGOOSE_URI || "localhost/databank";

var args = process.argv.slice(2);

var username = args[0];
var password = "Pa55w0rd*";
var role = args[1];
var email = username;


if (args.length < 2) {
  console.log("usage: node %s %s %s", path.basename(process.argv[1]), "user", "password");
  process.exit();
}

console.log("Username: %s", username);
console.log("Type: %s", role);
console.log("Email: %s" , email);

console.log("Creating a new user in Mongo");

var mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.connect(mongoose_uri);

mongoose.connection.on('error', function () {
  console.log('Mongoose connection error', arguments);
});

mongoose.connection.once('open', function callback() {
  console.log("Mongoose connected to the database");

  var user = new User();

  user.username = username;
  user.password = password;
  user.firstName = "Johnny";
  user.lastName = "Ratings";
  user.address = {};
  user.address.state = "FL";
  user.address.city = "Orlando";
  user.address.street = "1825 Anna Catherine Drive";
  user.address.zip = "32828";
  user.contactNum = "8482197734";
  user.userType = role;
  user.email = email;
  user.username = email;
  user.security_question = {
    "question1" : null,
    "question2" : null,
    "question3" : null,
    "answer1" : null,
    "answer2" : null,
    "answer3" : null
  };


  user.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log(user);
    }
    process.exit();
  });

});