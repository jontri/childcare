"use strict";

var mongoose = require('mongoose'),
    bcrypt = require("bcryptjs"),
    utils = require("../utils.js"),
    Schema = mongoose.Schema;

var UserSchema = new Schema({

  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  title: { type: String, required: false },
  firstName: { type: String, required: false },
  middleName: { type: String, required: false },
  lastName: { type: String, required: false },
  aliasName: { type: String, trim: true, required: false },
  suffix: { type: String, required: false },
  sex: { type: String, required: false },
  birth: { type: Schema.Types.Mixed, required: false },
  email: { type: String, required: false },
  sameAsHome:{type:Boolean,required:false,default:false},
  address: { type: Schema.Types.Mixed, required: false },
  work_address: { type: Schema.Types.Mixed, required: false },
  mailing_address: { type: Schema.Types.Mixed, required: false },
  contactNum: { type: String, required: false },
  mobileNum: { type: String, required: false },
  workNum: { type: String, required: false },
  contactNumType: { type: String, required: false },
  userType: { type : Schema.Types.Mixed, required: false },
  isParent: { type: String, required: false },
  isProvider: { type: String, required: false },
  salutation: { type: String, required: false },
  aliasEmail: { type: String, required: false },
  numChildren: { type: String, required: false },
  children: { type: Schema.Types.Mixed, required: false },
  switchDaycare: { type: Schema.Types.Mixed, required: false },
  income: { type: String, required: false },
  medium: { type: String, required: false },
  submedium: { type: String, required: false },
  preferredWayToAddress: { type: String, required: false },
  otherWayToAddress: { type: String, required: false },
  photo: { type: String, required: false },
  security_question: { type: Schema.Types.Mixed, required: false },
  used_password: { type: Array, required: false },
  status: { type: String, required: false },
  phone_number_verified: { type: String, required: false },
  verification_code: { type: String, required: false },
  contactBySms:{type:Boolean,required:false},
  contactByEmail:{type:Boolean,required:false,default:true},
  staff:[{
    listing_id : String,
    firstName:String,
    lastName:String,
    email:String,
    mobileNumber:String,
    phoneNumber:String,
    workNumber:String,
    role:String
  }],
  favorites:[Schema({name:String,listingId:Schema.Types.ObjectId}, {_id: false})],
  subscription: { type: Schema.Types.Mixed, required: false },

}, {

  toObject: {
    virtuals: true
  }, toJSON: {
    virtuals: true
  }
});

UserSchema.pre('save', function (next) {
  var user = this;
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) {
          return next(err);
        }
        user.password = hash;
        next();
      });
    });
  } else {
    return next();
  }
});

UserSchema.methods.comparePassword = function (passw, cb) {
  bcrypt.compare(passw, this.password, function (err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

UserSchema.methods.isUsedPassword = function (passw, cb, index) {
  var self = this;
  if (typeof index == 'undefined') {
    self.comparePassword(passw, function(err, isMatch) {
      if (err) {
        return cb(err);
      }
      if (!err && !isMatch) {
        self.isUsedPassword(passw, cb, 0);
      } else {
        return cb(null, true);
      }
    });
  } else {
    if (!self.used_password.length || index >= self.used_password.length) {
      return cb(null, false);
    }
    bcrypt.compare(passw, this.used_password[index], function(err, isMatch) {
      if (err) {
        return cb(err);
      }
      if (!err && !isMatch) {
        self.isUsedPassword(passw, cb, ++index);
      } else {
        cb(null, true);
      }
    });
  }
};

UserSchema.methods.addUsedPassword = function() {
  this.used_password.unshift(this.password);
  while(this.used_password.length > 2) {
    this.used_password.pop();
  }
};

UserSchema.pre('findOne', function(next) {
  this._conditions = utils.escapeRegExpQuery(this._conditions);
  next();
});

UserSchema.pre('findOneAndUpdate', function(next) {
  this._conditions = utils.escapeRegExpQuery(this._conditions);
  next();
});

UserSchema.pre('find', function(next) {
  this._conditions = utils.escapeRegExpQuery(this._conditions);
  next();
});

UserSchema.pre('findAndUpdate', function(next) {
  this._conditions = utils.escapeRegExpQuery(this._conditions);
  next();
});

UserSchema.pre('update', function(next) {
  this._conditions = utils.escapeRegExpQuery(this._conditions);
  next();
});

module.exports = mongoose.model('User', UserSchema);
