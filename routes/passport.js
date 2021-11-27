var debug = require('debug')('app:routes:passport' + process.pid),
    passport = require('passport'),
    path = require('path'),
    User = require(path.join(__dirname, "..", "models", "user.js")),
    JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt,
    LocalStategy = require('passport-local'),
    config = require(path.join(__dirname, "..", "config.json")),
    winston = require('winston');


var logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({filename: '/tmp/server.log'})
  ],
  exceptionHandlers: [
    new winston.transports.File({filename: '/tmp/server-exceptions.log'})
  ]
});

// set up options for jwt Strategy
var jwtOptions = {
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: config.secretKey
};

// jwt Strategy
var jwtLogin = new JwtStrategy(jwtOptions, function(payload, done) {
    logger.info('payload', payload);
    User.findById(payload.sub, function(err, user) {

        if (err) { return done(err, false); }

        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    });

});

passport.use(jwtLogin);
