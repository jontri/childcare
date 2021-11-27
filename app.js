"use strict";

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var path = require("path");
var notFoundError = require(path.join(__dirname, "errors", "notFound.js"));
var UnauthorizedAccessError = require(path.join(__dirname, "errors", "unauthAccess.js"));
var utils = require(path.join(__dirname, "utils.js"));
var unless = require('express-unless');
var onFinished = require('on-finished');
var winston = require('winston');
var cookieParser = require('cookie-parser');


var debug = require('debug')('app:' + process.pid);
var fs = require("fs");
var http_port = process.env.HTTP_PORT || 8085;
var https_port = process.env.HTTPS_PORT || 8443;
var config = require("./config.json");
var mongoose_uri = process.env.MONGOOSE_URI || "mongodb://ratingsville:r4tingsvill3@localhost:27017/databank?authSource=admin";

var session = require('express-session');
var sessionControl = require(path.join(__dirname, "controllers", "sessionControl.js"));

debug("Starting application");
debug("Loading Mongoose functionality");

var mongoose = require('mongoose');
mongoose.set('debug', true);
//console.log("MONGODB "+mongoose_uri);
mongoose.connect(mongoose_uri);

mongoose.connection.on('error', function() {
    debug('Mongoose connection error');
});

mongoose.connection.once('open', function callback() {
    debug("Mongoose connected to the database");
});

debug("Initializing express");
var express = require('express'),
    app = express(),
    https = require('https');

// const httpsOptions = {
//     key: fs.readFileSync('./key.pem'),
//     cert: fs.readFileSync('./cert.pem')
// }

debug("Attaching plugins");
app.use(require('morgan')("dev"));
var bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var logger = new(winston.Logger)({
    transports: [
        new winston.transports.Console({
            timestamp: true
        }),
        new winston.transports.File({
            filename: '/tmp/server.log',
            timestamp: true
        })
    ],
    exceptionHandlers: [
        new winston.transports.File({
            filename: '/tmp/server.log'
        })
    ]
});
// console.log("config: ", config);
var stripe = require('stripe')(config.test_api_key_secret);

//app.use(require('morgan')("dev"));
app.use(cookieParser());
app.use(cors());
app.use(require('compression')());
app.use(require('response-time')());
//app.use(session({secret: 'iGotASecret',cookie:{httpOnly: true,secure:true}})); // uncomment when website is HTTPS-enabled
app.use(session({secret: 'iGotASecret',cookie:{httpOnly: true}})); // initialize session secret key

app.use("/api//", function(req, res, next) {
    next(new notFoundError("404"));
});

app.use(function(req, res, next) {
    // logger.info("Start request - [%s]", req.url);

    onFinished(res, function(err) {
        // logger.info("Finished request - [%s]", req.url);
        // logger.info("[%s] Finished request - [%s]", req.connection.remoteAddress, req.url);

    });

    next();
});
var staticWeb = express.static('web');
staticWeb.unless = unless;
var jwtCheck = expressJwt({
  secret: config.secretKey
});


//app.use("/", staticWeb);
app.use(staticWeb.unless({ method: 'OPTIONS' }));

// add jwt check after route serving static file to allow user to view page
var middlewareUnless = utils.middleware();
//app.use(jwtCheck.unless({path: [ '/api/login','/api/user/register','/api/sessionsave' ]}));

app.use(middlewareUnless.unless({path: [ '/api/verify', '/api/logout', '/api/signup', '/api/sendRevApprovalEmail',
    '/api/sendSmsToken', '/api/verifySmsToken', '/api/all_users', '/api/password-reset','/api/addAuditLog',
    '/api/updateAuditLog','/api/incrementOverallAuditLog', '/api/owner-request','/api/approved_reviews/:listingId',
    '/api/get_review/:reviewId','/api/all_reviews', '/api/every_reviews', '/api/download-listing',
    '/api/downloadpdf/emergencycard', '/api//downloadpdf/AccidentIncidentreport', '/api/downloadpdf/ApplicationforEnrollment',
    '/api/downloadpdf/AuthorizationForMedication', '/api/downloadpdf/FreeandReducedPriceMeal','/api/downloadpdf/Infantfeeding',
    '/api/login','/api/broadcast','/api/user/register', '/api/sendInvite', '/api/sessionsave', '/api/states','/api/sessiondelete','/api/search',
    '/api/message', '/api/getAuditLog', '/api/sendFeedback','/api/listing','/api/questions','/api/all_parents',
    '/api/all_providers','/api/account/activation','/api/getLatLng','/api/password-reset','/api/send-username', '/api/subscribe', '/api/stripe/events',
    '/api/downloadpdf/MedicalStatementandDietaryConditions','/api/verify-reset-link',/\/api\/(listing|review|broadcast)\/.*/,
    '/api/save-new-password','/api/account-lock',/\/api\/downloadpdf\/.*/ , /\/api\/user\/.*/, /\/api\/article\/.*/,'/api/check-email',
    /\/api\/document\/history\/.*/,/\/api\/owner\-request\/[^\/]*/,/\/api\/appointment\/[^\/]*/
    ]}));

app.use("/api", require(path.join(__dirname, "routes", "services.js"))());


// @very_important - do not move this code up before "/api" code.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// all other requests redirect to 404
app.all("*", function(req, res, next) {
    next(new notFoundError("404"));
});



// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
//     next();
// });

// app.all('*', function(req, res, next) {
//     res.header('Access-Control-Allow-Origin', 'https://maps.googleapis.com');
//     res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
//     res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
//     if ('OPTIONS' == req.method) {
//         res.sendStatus(200);
//     } else {
//         next();
//     }
// });

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization");
    next();
});

//error handler for all the applications
app.use(function(err, req, res, next) {

    var errorType = typeof err,
        code = 500,
        msg = {
            message: "Internal Server Error"
        };

    switch (err.name) {
        case "UnauthorizedError":
            code = err.status;
            msg = undefined;
            break;
        case "BadRequestError":
        case "authAccessError":
        case "NotFoundError":
            code = err.status;
            msg = err.inner;
            break;
        default:
            break;
    }

    logger.error(err.stack);

    return res.status(code).json(msg);

});

require('http').createServer(app).listen(http_port, function() {

    debug("HTTP Server listening on port: %s, in %s mode", http_port, app.get('env'));
    logger.info('API Gateway listening at  http://localhost:' + http_port + "/api");
    logger.info('Web Server listening at  http://localhost:' + http_port + "/");

});

// const server = https.createServer(httpsOptions, app).listen(http_port, function() {
//
//     debug("HTTP Server listening on port: %s, in %s mode", http_port, app.get('env'));
//     logger.info('API Gateway listening at  https://localhost:' + http_port + "/api");
//     logger.info('Web Server listening at  https://localhost:' + http_port + "/");
//
// });

