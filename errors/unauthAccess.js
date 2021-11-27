"use strict";
function authAccessError(code, error) {
  Error.call(this, error.message);
  Error.captureStackTrace(this, this.constructor);
  this.name = "authAccessError";
  this.message = error.message;
  this.code = code;
  this.status = 401;
  this.inner = error;
}

authAccessError.prototype = Object.create(Error.prototype);
authAccessError.prototype.constructor = authAccessError;

module.exports = authAccessError;