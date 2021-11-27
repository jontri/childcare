"use strict";
function systemException(code, error) {
  Error.call(this, error.message);
  Error.captureStackTrace(this, this.constructor);
  this.name = "systemException";
  this.message = error.message;
  this.code = code;
  this.status = 500;
  this.inner = error;
}

systemException.prototype = Object.create(Error.prototype);
systemException.prototype.constructor = systemException;

module.exports = systemException;