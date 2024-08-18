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
var jwtVerifier_exports = {};
__export(jwtVerifier_exports, {
  default: () => jwtVerifier_default,
  jwtVerifier: () => jwtVerifier,
  verifySignature: () => verifySignature
});
module.exports = __toCommonJS(jwtVerifier_exports);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_common = require("./common");
const createSignature = ({
  payload,
  secret = import_common.DEFAULT_WEBHOOK_SECRET,
  options
}) => {
  try {
    const signOptions = options?.issuer ? { issuer: options?.issuer } : void 0;
    return import_jsonwebtoken.default.sign(payload, secret, { ...signOptions });
  } catch (error) {
    throw new import_common.WebhookSignError(error.message);
  }
};
const verifySignature = ({
  payload,
  secret = import_common.DEFAULT_WEBHOOK_SECRET,
  signature,
  options
}) => {
  try {
    if (payload === void 0 || payload?.length === 0) {
      console.warn("Missing payload");
    }
    if (options?.issuer) {
      import_jsonwebtoken.default.verify(signature, secret, { issuer: options?.issuer });
    } else {
      import_jsonwebtoken.default.verify(signature, secret);
    }
    return true;
  } catch {
    throw new import_common.WebhookVerificationError();
  }
};
const jwtVerifier = (options) => {
  return {
    sign: ({ payload, secret }) => {
      return createSignature({ payload, secret, options });
    },
    verify: ({ payload, secret, signature }) => {
      return verifySignature({ payload, secret, signature, options });
    },
    type: "jwtVerifier"
  };
};
var jwtVerifier_default = jwtVerifier;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  jwtVerifier,
  verifySignature
});
