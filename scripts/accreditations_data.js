// node accreditations_data.js
var mongoose = require('mongoose');
mongoose.set('debug', true);
var path = require("path");

var mongoose_uri = "mongodb://ratingsville:r4tingsvill3@localhost:27017/databank?authSource=admin";
var connection =  mongoose.connect(mongoose_uri);

var Accreditation = require(path.join(__dirname, "..", "models", "accreditation.js"));
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

  var accredHash = {};

  updateListing(0);

  function updateListing(idx) {
    function isUpperCase(str) {
      return str === str.toUpperCase();
    }

    if (listings.length <= idx) return;

    var listing = listings[idx];
    var findOneTasks = [];
    var delay = (!(idx%1000)) ? 1000 : 1; // delay every 1000 by 1 second
    var update;

    if (!listing.accreditations || !listing.accreditations.length) {
      logger.info('NO ACCREDITATIONS '+listing.name);
      if (listing.goldSealAccreditation) {
        if (listing.goldSealAccreditation.agency && !isUpperCase(listing.goldSealAccreditation.agency)) {
          listing.goldSealAccreditation.agency = listing.goldSealAccreditation.agency.toUpperCase();
          update = true;
        }
        if (listing.goldSealAccreditation.name && !isUpperCase(listing.goldSealAccreditation.name)) {
          listing.goldSealAccreditation.name = listing.goldSealAccreditation.name.toUpperCase();
          update = true;
        }
        if (update) {
          listing.update({goldSealAccreditation: listing.goldSealAccreditation}, function() {
            finished();
            setTimeout(updateListing,delay,++idx);
          });
        } else {
          finished();
          setTimeout(updateListing,delay,++idx);
        }
      }
      return;
    }

    var accredArr = [];

    listing.accreditations.forEach(function(accreditation, index) {
      if (accreditation.name && (!accreditation.origin || accreditation.origin !== 'ui')) {
        if (!isUpperCase(accreditation.name)) {
          accreditation.name = accreditation.name.toUpperCase();
          update = true;
        }
        if (!accredHash[accreditation.name]) {
          findOneTasks.push(function(cb) {
            Accreditation.findOne({name: accreditation.name}, cb);
          });
          accredArr.push(accreditation);
          accredHash[accreditation.name] = true;
        }
      }
    });

    if (update) listing.update({accreditations: listing.accreditations}).exec();

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
          var accreditation = accredArr[index];
          var newAccreditation = new Accreditation({
            name: accreditation.name.toUpperCase(),
            goldSeal: listing.goldSeal === 'Y',
            vpk: listing.vpk === 'Y',
            origin: 'db'
          });

          saveTasks.push(function(cb) {
            newAccreditation.save(cb);
          });
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
        setTimeout(updateListing,delay,++idx);
      });
    });
  }

  logger.info('ADDITIONAL AGENCIES');

  // add agencies that may not have been included
  var additionalAgencies = [
    {name: 'Association of Christian Schools International', goldSeal: true, vpk: true},
    {name: 'Association of Christian Teachers and Schools', goldSeal: true, vpk: true},
    {name: 'Accredited Professional Preschool Learning Environment', goldSeal: true},
    {name: 'Council of Accreditation', goldSeal: true},
    {name: 'Florida Coalition of Christian Private School Accreditation', goldSeal: true},
    {name: 'Florida League of Christian Schools', goldSeal: true, vpk: true},
    {name: 'Green Apple Accreditation of Children\'s Services', goldSeal: true},
    {name: 'National Accreditation Commission for Early Care and Education Programs', goldSeal: true},
    {name: 'National Association for the Education of Young Children', goldSeal: true},
    {name: 'National Association for Family Child Care', goldSeal: true},
    {name: 'National Council for Private School Accreditation', goldSeal: true, vpk: true},
    {name: 'National Early Childhood Program Accreditation', goldSeal: true},
    {name: 'National Lutheran School Accreditation', goldSeal: true},
    {name: 'Southern Association of Colleges and Schools', goldSeal: true, vpk: true},
    {name: 'United Methodist Association of Preschools', goldSeal: true},
    {name: 'Western Association of Colleges and Schools', vpk: true},
    {name: 'North Central Association of Colleges and Schools', vpk: true},
    {name: 'Middle States Association of Colleges and Schools', vpk: true},
    {name: 'New England Association of Colleges and Schools', vpk: true},
    {name: 'Accreditation International', vpk: true},
    {name: 'Accrediting Association of Seventh-day Adventist Schools', vpk: true},
    {name: 'American Montessori Society', vpk: true},
    {name: 'Association of Independent Schools of Florida', vpk: true},
    {name: 'Association of Waldorf Schools of North America', vpk: true},
    {name: 'Christian Schools of Florida', vpk: true},
    {name: 'E. A. Sutherland Education Association', vpk: true},
    {name: 'Florida Association of Christian Colleges and Schools', vpk: true},
    {name: 'Florida Catholic Conference', vpk: true},
    {name: 'Kentucky Non-Public School Commission, Inc.', vpk: true},
    {name: 'Middle States Association - Commissions on Elementary and Secondary Schools', vpk: true},
    {name: 'National Accreditation Board of Merkos L\'Inyonei Chinuch', vpk: true},
    {name: 'National Independent Private Schools Association', vpk: true},
    {name: 'North American Christian School Accrediting Agency', vpk: true},
    {name: 'Southern Association of Independent Schools', vpk: true},
    {name: 'Wisconsin Evangelical Lutheran Synod School Accreditation', vpk: true},
    {name: 'Florida Association of Academic Nonpublic School', vpk: true},
    {name: 'Church of God Association of Christian Schools', vpk: true},
    {name: 'Council of Bilingual Schools', vpk: true},
    {name: 'Episcopal Diocese of Florida', vpk: true},
    {name: 'Florida Conference of Seventh-Day Adventist Schools', vpk: true},
    {name: 'Florida Council of Independent Schools', vpk: true},
    {name: 'Florida Kindergarten Council', vpk: true},
    {name: 'Lutheran Schools: The Florida-Georgia District', vpk: true}
  ];

  var findOneTasks = [];
  var agencyArr = [];
  var numOfAdditionalFinished = 0;

  additionalAgencies.forEach(function(agency) {
    agency.name = agency.name.toUpperCase();
    agency.origin = 'db';
    agencyArr.push(agency);
    findOneTasks.push(function(cb) {
      Accreditation.findOne({name: agency.name}, cb);
    });
  });

  async.parallel(findOneTasks, function(err, findOnes) {
    if (err) {
      logger.error('ADDITIONAL AGENCIES FIND ONES');
      logger.info(JSON.stringify(err));
      additionalFinished();
      return;
    }

    findOnes.forEach(function(findOne, index) {
      if (!findOne) {
        var newAccreditation = new Accreditation(agencyArr[index]);
        newAccreditation.save(function(err) {
          if (err) {
            logger.error('ADDITIONAL AGENCY SAVE');
            logger.info(JSON.stringify(err));
            additionalFinished();
            return;
          }

          additionalFinished();
        });
      } else {
        additionalFinished();
      }
    });
  });

  function finished() {
    process.stdout.write('\r'+(++numOfFinished)/numOfListings*100+'%');
  }

  function additionalFinished() {
    process.stdout.write('\r'+(++numOfAdditionalFinished)/additionalAgencies.length*100+'%');
  }
});