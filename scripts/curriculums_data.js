// node curriculums_data.js
var mongoose = require('mongoose');
mongoose.set('debug', true);
var path = require("path");

var mongoose_uri = "mongodb://ratingsville:r4tingsvill3@localhost:27017/databank?authSource=admin";
var connection =  mongoose.connect(mongoose_uri);

var Curriculum = require(path.join(__dirname, "..", "models", "curriculum.js"));
var Listing = require(path.join(__dirname, "..", "models", "listing.js"));

var async = require('async');

mongoose.connection.on('error', function (error) {
    console.log('Mongoose connection error');
});

var winston = require('winston');
var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console()
    ],
    exceptionHandlers: [
        new winston.transports.Console()
    ]
});

Listing.find({}, function(err, listings) {
    if (err) {
        logger.error('FIND LISTINGS');
        logger.info(JSON.stringify(err));
        return;
    }

    var numOfListings = listings.length;
    var numOfFinished = 0;

    if (numOfListings === numOfFinished) {
        logger.info('NO LISTINGS FOUND');
        return;
    }

    // initialize with blacklisted curriculums
    var curriculumHash = {
        'NOT AVAILABLE': true
    };

    listings.forEach(function(listing) {
        var findOneTasks = [];

        if (!listing.curriculum || !listing.curriculum.length) {
            logger.info('NO CURRICULUMs '+listing.name);
            finished();
            return;
        }

        var curriculumArr = [];

        listing.curriculum.forEach(function(curriculum, index) {
            if (typeof curriculum === 'string') {
                curriculum = {description: curriculum};
                listing.curriculum[index] = curriculum;
            }
            // convert to upper case to prevent duplicates
            curriculum.description = curriculum.description.toUpperCase();
            if (!curriculumHash[curriculum.description]) {
                findOneTasks.push(function(cb) {
                    Curriculum.findOne({description: curriculum.description}, cb);
                });
                curriculumArr.push(curriculum);
                curriculumHash[curriculum.description] = true;
            }
        });

        listing.update({curriculum: listing.curriculum}).exec();

        async.parallel(findOneTasks, function(err, findOnes) {
            if (err) {
                logger.error('FIND ONES');
                logger.info(JSON.stringify(err));
                finished();
                return;
            }

            var saveTasks = [];

            findOnes.forEach(function(findOne, index) {
                if (!findOne) {
                    var curriculum = curriculumArr[index];
                    if (!curriculum.origin || curriculum.origin !== 'ui') {
                        var newCurriculum = new Curriculum({
                            description: curriculum.description,
                            origin: 'db'
                        });
                        if (curriculum.publisher) {
                            newCurriculum.publisher = curriculum.publisher.toUpperCase();
                        }

                        saveTasks.push(function(cb) {
                            newCurriculum.save(cb);
                        });
                    }
                } else {
                    finished();
                }
            });

            async.parallel(saveTasks, function(err, saves) {
                if (err) {
                    logger.error('SAVES');
                    logger.info(JSON.stringify(err));
                    finished();
                    return;
                }

                finished();
            });
        });
    });

    function finished() {
        process.stdout.write('\r'+(++numOfFinished)/numOfListings*100+'%');
    }
});