var path = require('path'),
    _ = require("lodash"),
    utils = require("../utils.js"),
    debug = require('debug')('app:routes:services' + process.pid),
    UnauthorizedAccessError = require(path.join(__dirname, "..", "errors", "unauthAccess.js")),
    SystemExceptionError = require(path.join(__dirname, "..", "errors", "systemException.js"));


var User = require(path.join(__dirname, "..", "models", "user.js"));
var LoginAttempt = require(path.join(__dirname, "..", "models", "login_attempt.js"));

exports.authenticate = function (req, res, next) {

  debug("Processing authenticate middleware: Authenticating - " + req.body.username);

  var username = req.body.username,
      password = req.body.password;

  var ip = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

  if (_.isEmpty(username) || _.isEmpty(password)) {
    return next(new UnauthorizedAccessError("401", {
      message: 'Empty username or password'
    }));
  }


  process.nextTick( function () {
    loginByIp(ip, username,password,req,res,next);
  });

};

function loginByIp(ip, username, password, req, res, next) {

  // locking by ip
  LoginAttempt.findOne({
    ip: ip,
    is_resolved: false
  }, function (err, existingAttempt) {

    if (err) {
      return next(new SystemExceptionError("500", {message: 'Exception checking login attempt'}));
      console.log("Exception checking login attempt");
    }

    var numberOfAttempts = 1;
    if (!existingAttempt) {
      var login_attempt = new LoginAttempt({
        ip: ip,
        attempts: numberOfAttempts,
        is_resolved: false
      });

      //try {
      //  login_attempt.save(function (err) {
      //    if (err) {
      //      return next(new SystemExceptionError("500", {message: 'Exeption saving login attempt'}));
      //      console.log("Exception saving login_attempt");
      //    }
      //  });
      //} catch (excp) {
      //  console.log("Exeption occured saving login attempt");
      //}

      loginByEmail(username, password, login_attempt,req,res,next);

    } else {
      numberOfAttempts = existingAttempt.attempts;
      //existingAttempt.attempts = numberOfAttempts;


      var lockLimit = (60 * 60 * 1000) * 5; // 5 hours
      var retryLimit = (60 * 60 * 1000) * 1 // 1 hour
      var durationLocked = ((new Date()) - existingAttempt.last_attempt);


      if (numberOfAttempts >= 10) {
        if (durationLocked < lockLimit) {
          console.log("Number of duration lock not beyond limit");
          //existingAttempt.save();
          return res.status(422).send({
            error: 'IP Address Locked',
            error_type: 'account_blocked_ip'
          });
        } else {
          existingAttempt.attempts = 0;
          loginByEmail(username,password,existingAttempt, req, res, next);
        }
        //existingAttempt.save();

      } else {

        if (durationLocked > retryLimit) {
          existingAttempt.attempts = 1;
        }

        console.log("Number of IP attempts : " + existingAttempt.attempts + " by IP: " + existingAttempt.ip);
        existingAttempt.last_attempt = new Date();
        loginByEmail(username,password,existingAttempt, req, res, next);
        //existingAttempt.save(
        //    function (err, existingAttempt, numAffected) {
        //      loginByEmail(username,password,existingAttempt, req, res, next);
        //    }
        //);
      }
    }
  });

}
// this will check if email and password match and also check locking by email
function loginByEmail(username, password, existingAttemptByIp, req, res, next) {

  User.findOne({
    $or: [{
      username: username
    }, {
      email: username
    }]
  }, function (err, user) {

    if (err || !user) {
      console.log("Invalid Username or Password");
      existingAttemptByIp.attempts = existingAttemptByIp.attempts + 1;
      existingAttemptByIp.save();
      return next(new UnauthorizedAccessError("401", {
        message: 'Invalid username or password'
      }));
    }

    user.comparePassword(password, function (err, isMatch) {
      if (isMatch && !err) {

        console.log("Password match.  Finding logins based on email");
        var account_is_locked = false;
        LoginAttempt.findOne({
          email: user.email,
          is_resolved: false
        }, function (err, existingAttempt) {

          if (err) {
            return next(err);
          }


          if (existingAttempt && existingAttempt.attempts >= 3 ) {

            var lockLimit = (60 * 60 * 1000) * 2;
            var durationLocked = ((new Date()) - existingAttempt.last_attempt);
            account_is_locked = durationLocked < lockLimit;

            console.log(" Checking log attempt: " + existingAttempt.attempts + " " + account_is_locked);

            if(account_is_locked) {
              return res.status(422).send({
                error: 'Username locked',
                error_type: 'account_blocked'
              });
              // should i reset the date again?
            } else {
              existingAttempt.is_resolved = true;
              existingAttempt.save();

            }


          }
          else if (existingAttempt) {
            console.log("Unlocking account: Beyond limit");
            existingAttempt.is_resolved = true;
            existingAttempt.save();
          }
        });


        debug("User authenticated, generating token");
        if(!account_is_locked) {
          utils.create(user, req, res, next);
        }

      } else {
        console.log("Password mismatch.  Auditing failed login.");
        var numberOfAttempts = 1;

        existingAttemptByIp.attempts = existingAttemptByIp.attempts + 1;
        existingAttemptByIp.save();

        if (!err && !isMatch) {
          // locking by email
          LoginAttempt.findOne({
            email: user.email,
            is_resolved: false
          }, function (err, existingAttempt) {

            if (err) {
              console.log("Exception checking login attempt");
              return next(new SystemExceptionError("500", {message: 'Exception checking login attempt'}));
            }


            if (!existingAttempt) {
              var login_attempt = new LoginAttempt({
                email: user.email,
                attempts: numberOfAttempts,
                is_resolved: false
              });

              try {
                login_attempt.save(function (err) {
                  if (err) {
                    console.log("Exeption saving login attempt");
                    return next(new SystemExceptionError("500", {message: 'Exeption saving login attempt'}));
                  }
                });
              } catch (excp) {
                console.log("Exeption saving login attempt");
              }

            } else {

              numberOfAttempts = existingAttempt.attempts + 1;
              existingAttempt.last_attempt = new Date();
              existingAttempt.attempts = numberOfAttempts;
              existingAttempt.save();

              if (numberOfAttempts >= 3) {

                return res.status(422).send({
                  error: 'Username locked',
                  error_type: 'account_blocked'
                });
              }
            }

            if (numberOfAttempts < 3) {
              console.log("Number of attempts: " + numberOfAttempts);
              return next(new UnauthorizedAccessError("401", {
                message: 'Invalid password or username'
              }));
            }

          });
        }

      }
    });

  });
}


