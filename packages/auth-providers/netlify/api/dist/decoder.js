"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var decoder_exports = {};
__export(decoder_exports, {
  authDecoder: () => authDecoder
});
module.exports = __toCommonJS(decoder_exports);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
const authDecoder = async (token, type, req) => {
  if (type !== "netlify") {
    return null;
  }
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    const decodedToken = import_jsonwebtoken.default.decode(token);
    const nowTimestamp = Math.floor(Date.now() / 1e3);
    if (nowTimestamp >= decodedToken.exp) {
      throw new import_jsonwebtoken.TokenExpiredError(
        "jwt expired",
        new Date(decodedToken.exp * 1e3)
      );
    }
    return decodedToken;
  } else {
    const clientContext = req.context?.clientContext;
    return clientContext?.user || null;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  authDecoder
});
