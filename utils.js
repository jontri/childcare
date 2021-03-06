"use strict";

var debug = require('debug')('app:utils:' + process.pid),
    path = require('path'),
    util = require('util'),
    fs = require('fs'),
    redis = require("redis"),
    client = redis.createClient(),
    _ = require("lodash"),
    config = require("./config.json"),
    jsonwebtoken = require("jsonwebtoken"),
    TOKEN_EXPIRATION = 600,
    TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION * 60,
    UnauthorizedAccessError = require(path.join(__dirname, 'errors', 'unauthAccess.js'));

client.on('error', function (err) {
  debug(err);
});

client.on('connect', function () {
  debug("Redis successfully connected");
});

module.exports.fetch = function (headers) {
  if (headers && headers.authorization) {
    var authorization = headers.authorization;
    var part = authorization.split(' ');
    if (part.length === 2) {
      var token = part[1];
      return part[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports.create = function (user, req, res, next) {

  debug("Create token");

  if (_.isEmpty(user)) {
    return next(new Error('User data cannot be empty.'));
  }

  var data = {
    _id: user._id,
    username: user.username,
    access: user.access,
    email: user.email,
    title: user.title,
    firstName: user.firstName,
    lastName: user.lastName,
    suffix: user.suffix,
    middleName: user.middleName,
    sex: user.sex,
    address: {
      state: user.address.state,
      city: user.address.city,
      street: user.address.street,
      zip: user.address.zip,
    },
    photo: user.photo,
    contactNum: user.contactNum,
    mobileNum: user.mobileNum,
    workNum: user.workNum,
    contactByEmail: user.contactByEmail,
    contactBySms: user.contactBySms,
    userType: user.userType,
    status: user.status,
    security_question: user.security_question,
    token: jsonwebtoken.sign({ _id: user._id }, config.secretKey, {
      expiresInMinutes: TOKEN_EXPIRATION
    })
  };

  var decoded = jsonwebtoken.decode(data.token);

  data.token_exp = decoded.exp;
  data.token_iat = decoded.iat;

  debug("Token generated for user: %s, token: %s", data.username, data.token);

  client.set(data.token, JSON.stringify(data), function (err, reply) {
    if (err) {
      return next(new Error(err));
    }

    if (reply) {
      client.expire(data.token, TOKEN_EXPIRATION_SEC, function (err, reply) {
        if (err) {
          return next(new Error("Can not set the expire value for the token key"));
        }
        if (reply) {
          req.user = data;
          next(); // we have succeeded
        } else {
          return next(new Error('Expiration not set on redis'));
        }
      });
    }
    else {
      return next(new Error('Token not set in redis'));
    }
  });

  return data;

};

module.exports.retrieve = function (id, done) {

  debug("Calling retrieve for token: %s", id);

  if (_.isNull(id)) {
    return done(new Error("token_invalid"), {
      "message": "Invalid token"
    });
  }

  client.get(id, function (err, reply) {
    if (err) {
      return done(err, {
        "message": err
      });
    }

    if (_.isNull(reply)) {
      return done(new Error("token_invalid"), {
        "message": "Token doesn't exists, are you sure it hasn't expired or been revoked?"
      });
    } else {
      var data = JSON.parse(reply);
      debug("User data fetched from redis store for user: %s", data.username);

      if (_.isEqual(data.token, id)) {
        return done(null, data);
      } else {
        return done(new Error("token_doesnt_exist"), {
          "message": "Token doesn't exists, login into the system so it can generate new token."
        });
      }

    }

  });

};

module.exports.verify = function (req, res, next) {

  debug("Verifying token");

  var token = exports.fetch(req.headers);

  jsonwebtoken.verify(token, config.secretKey, function (err, decode) {

    if (err) {
      req.user = undefined;
      return next(new UnauthorizedAccessError("invalid_token"));
    }

    exports.retrieve(token, function (err, data) {

      if (err) {
        req.user = undefined;
        return next(new UnauthorizedAccessError("invalid_token", data));
      }

      req.user = data;
      next();

    });

  });
};

module.exports.expire = function (headers) {

  var token = exports.fetch(headers);

  debug("Expiring token: %s", token);

  if (token !== null) {
    client.expire(token, 0);
  }

  return token !== null;

};

module.exports.middleware = function () {

  var func = function (req, res, next) {

    var token = exports.fetch(req.headers);

    exports.retrieve(token, function (err, data) {

      if (err) {
        req.user = undefined;
        return next(new UnauthorizedAccessError("invalid_token", data));
      } else {
        req.user = _.merge(req.user, data);
        next();
      }

    });
  };

  func.unless = require("express-unless");

  return func;

};

module.exports.escapeRegExpQuery = function(query, doRegex) {
  if (typeof query == 'object') {
    if (!(query instanceof Array) && !(query instanceof RegExp)) {
      for (var key in query) {
        if (query.hasOwnProperty(key)) {
          switch(key) {
            case 'email':
            case 'username':
            case 'aliasName':
              query[key] = this.escapeRegExpQuery(query[key], true);
              break;
            default:
              query[key] = this.escapeRegExpQuery(query[key]);
              break;
          }
        }
      }
    } else if (query instanceof Array) {
      for (var i = 0; i < query.length; i++) {
        query[i] = this.escapeRegExpQuery(query[i]);
      }
    }
  } else if (doRegex) {
    query = new RegExp('^'+_.escapeRegExp(query)+'$', 'i');
  }
  return query;
};

module.exports.processReqFile = function(file, newFileName) {
  var split = file.path.split(path.sep);
  var fileName = split[split.length - 1];
  if (newFileName) {
    fileName = split[split.length - 1] = newFileName + path.extname(fileName);
    fs.rename(file.path, split.join(path.sep));
  }
  return fileName;
};

module.exports.TOKEN_EXPIRATION = TOKEN_EXPIRATION;
module.exports.TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION_SEC;

module.exports.EMAIL_CONFIRMATION_TYPES = {
  REGISTER: 'register',
  RESEND: 'resend',
  CHANGED: 'changed'
};

debug("Loaded");
