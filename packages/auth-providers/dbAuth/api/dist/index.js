"use strict";

var _context, _context2;
var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/for-each");
var _Object$keys = require("@babel/runtime-corejs3/core-js/object/keys");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  PasswordValidationError: true,
  authDecoder: true,
  createAuthDecoder: true
};
_Object$defineProperty(exports, "PasswordValidationError", {
  enumerable: true,
  get: function () {
    return _errors.PasswordValidationError;
  }
});
_Object$defineProperty(exports, "authDecoder", {
  enumerable: true,
  get: function () {
    return _decoder.authDecoder;
  }
});
_Object$defineProperty(exports, "createAuthDecoder", {
  enumerable: true,
  get: function () {
    return _decoder.createAuthDecoder;
  }
});
var _DbAuthHandler = require("./DbAuthHandler");
_forEachInstanceProperty(_context = _Object$keys(_DbAuthHandler)).call(_context, function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _DbAuthHandler[key]) return;
  _Object$defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _DbAuthHandler[key];
    }
  });
});
var _errors = require("./errors");
var _shared = require("./shared");
_forEachInstanceProperty(_context2 = _Object$keys(_shared)).call(_context2, function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _shared[key]) return;
  _Object$defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _shared[key];
    }
  });
});
var _decoder = require("./decoder");