"use strict";

var _context;
var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _forEachInstanceProperty = require("@babel/runtime-corejs3/core-js/instance/for-each");
var _Object$keys = require("@babel/runtime-corejs3/core-js/object/keys");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  createVerifier: true
};
exports.createVerifier = void 0;
var _common = require("./common");
_forEachInstanceProperty(_context = _Object$keys(_common)).call(_context, function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _common[key]) return;
  _Object$defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _common[key];
    }
  });
});
/**
 * @param {SupportedVerifierTypes} type - What verification type methods used to sign and verify signatures
 * @param {VerifyOptions} options - Options used to verify the signature based on verifiers requirements
 */
const createVerifier = (type, options) => {
  if (options) {
    return _common.verifierLookup[type](options);
  } else {
    return _common.verifierLookup[type]();
  }
};
exports.createVerifier = createVerifier;