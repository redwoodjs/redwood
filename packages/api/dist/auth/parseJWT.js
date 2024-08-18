"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var parseJWT_exports = {};
__export(parseJWT_exports, {
  parseJWT: () => parseJWT
});
module.exports = __toCommonJS(parseJWT_exports);
function isTokenWithRoles(token) {
  return !!token.decoded?.roles;
}
function isTokenWithMetadata(token) {
  const claim = token.namespace ? `${token.namespace}/app_metadata` : "app_metadata";
  return !!token.decoded?.[claim];
}
const appMetadata = (token) => {
  if (typeof token.decoded === "string") {
    return {};
  }
  if (isTokenWithMetadata(token)) {
    const claim = token.namespace ? `${token.namespace}/app_metadata` : "app_metadata";
    return token.decoded?.[claim];
  }
  return {};
};
const roles = (token) => {
  if (isTokenWithRoles(token)) {
    return token.decoded.roles;
  }
  const metadata = appMetadata(token);
  return metadata?.roles || metadata.authorization?.roles || [];
};
const parseJWT = (token) => {
  return {
    appMetadata: appMetadata(token),
    roles: roles(token)
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parseJWT
});
