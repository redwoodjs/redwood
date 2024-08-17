"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireWildcard = require("@babel/runtime-corejs3/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.authDecoder = void 0;
var _now = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/date/now"));
var _jsonwebtoken = _interopRequireWildcard(require("jsonwebtoken"));
const authDecoder = async (token, type, req) => {
  if (type !== 'netlify') {
    return null;
  }

  // Netlify verifies and decodes the JWT before the request is passed to our
  // Serverless function, so the decoded JWT is already available in production.
  // For development and test we can't verify the token because we don't have
  // the signing key. Just decoding the token is the best we can do to emulate
  // the native Netlify experience
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    // In dev, we don't have access to the JWT private key to verify
    // So we simulate a verification
    const decodedToken = _jsonwebtoken.default.decode(token);
    const nowTimestamp = Math.floor((0, _now.default)() / 1000);
    if (nowTimestamp >= decodedToken.exp) {
      throw new _jsonwebtoken.TokenExpiredError('jwt expired', new Date(decodedToken.exp * 1000));
    }
    return decodedToken;
  } else {
    const clientContext = req.context?.clientContext;
    return clientContext?.user || null;
  }
};
exports.authDecoder = authDecoder;