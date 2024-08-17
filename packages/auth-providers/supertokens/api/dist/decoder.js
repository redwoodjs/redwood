"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.authDecoder = void 0;
var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/promise"));
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _jwksRsa = _interopRequireDefault(require("jwks-rsa"));
const authDecoder = async (token, type) => {
  if (type !== 'supertokens') {
    return null;
  }
  return new _promise.default((resolve, reject) => {
    const {
      SUPERTOKENS_JWKS_URL
    } = process.env;
    if (!SUPERTOKENS_JWKS_URL) {
      throw new Error('SUPERTOKENS_JWKS_URL env var is not set');
    }
    const client = (0, _jwksRsa.default)({
      jwksUri: SUPERTOKENS_JWKS_URL
    });
    function getKey(header, callback) {
      client.getSigningKey(header.kid, function (err, key) {
        const signingKey = key?.getPublicKey();
        callback(err, signingKey);
      });
    }
    _jsonwebtoken.default.verify(token, getKey, {}, function (err, decoded) {
      if (err) {
        return reject(err);
      }
      decoded = decoded || {};
      if (typeof decoded === 'string') {
        return resolve({
          decoded
        });
      }
      return resolve(decoded);
    });
  });
};
exports.authDecoder = authDecoder;