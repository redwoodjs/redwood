"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.createAuthDecoder = exports.authDecoder = void 0;
var _shared = require("./shared");
const createAuthDecoder = cookieNameOption => {
  return async (_token, type, req) => {
    if (type !== 'dbAuth') {
      return null;
    }
    const session = (0, _shared.dbAuthSession)(req.event, cookieNameOption);

    // We no longer compare the session id with the bearer token
    return session;
  };
};

/** @deprecated use `createAuthDecoder` */
exports.createAuthDecoder = createAuthDecoder;
const authDecoder = async (_authHeaderValue, type, req) => {
  if (type !== 'dbAuth') {
    return null;
  }

  // Passing `undefined` as the second argument to `dbAuthSession` will make
  // it fall back to the default cookie name `session`, making it backwards
  // compatible with existing RW apps.
  const session = (0, _shared.dbAuthSession)(req.event, undefined);
  return session;
};
exports.authDecoder = authDecoder;