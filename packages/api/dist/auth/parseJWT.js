"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.parseJWT = void 0;
function isTokenWithRoles(token) {
  return !!token.decoded?.roles;
}
function isTokenWithMetadata(token) {
  const claim = token.namespace ? `${token.namespace}/app_metadata` : 'app_metadata';
  return !!token.decoded?.[claim];
}
const appMetadata = token => {
  if (typeof token.decoded === 'string') {
    return {};
  }
  if (isTokenWithMetadata(token)) {
    const claim = token.namespace ? `${token.namespace}/app_metadata` : 'app_metadata';
    return token.decoded?.[claim];
  }
  return {};
};
const roles = token => {
  if (isTokenWithRoles(token)) {
    return token.decoded.roles;
  }
  const metadata = appMetadata(token);
  return metadata?.roles || metadata.authorization?.roles || [];
};
const parseJWT = token => {
  return {
    appMetadata: appMetadata(token),
    roles: roles(token)
  };
};
exports.parseJWT = parseJWT;