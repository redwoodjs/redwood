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
var decoder_exports = {};
__export(decoder_exports, {
  authDecoder: () => authDecoder,
  createAuthDecoder: () => createAuthDecoder
});
module.exports = __toCommonJS(decoder_exports);
var import_shared = require("./shared");
const createAuthDecoder = (cookieNameOption) => {
  return async (_token, type, req) => {
    if (type !== "dbAuth") {
      return null;
    }
    const session = (0, import_shared.dbAuthSession)(req.event, cookieNameOption);
    return session;
  };
};
const authDecoder = async (_authHeaderValue, type, req) => {
  if (type !== "dbAuth") {
    return null;
  }
  const session = (0, import_shared.dbAuthSession)(req.event, void 0);
  return session;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authDecoder,
  createAuthDecoder
});
