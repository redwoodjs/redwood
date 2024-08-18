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
var common_exports = {};
__export(common_exports, {
  DEFAULT_TOLERANCE: () => DEFAULT_TOLERANCE,
  DEFAULT_WEBHOOK_SECRET: () => DEFAULT_WEBHOOK_SECRET,
  VERIFICATION_ERROR_MESSAGE: () => VERIFICATION_ERROR_MESSAGE,
  VERIFICATION_SIGN_MESSAGE: () => VERIFICATION_SIGN_MESSAGE,
  WebhookSignError: () => WebhookSignError,
  WebhookVerificationError: () => WebhookVerificationError,
  verifierLookup: () => verifierLookup
});
module.exports = __toCommonJS(common_exports);
var import_base64Sha1Verifier = __toESM(require("./base64Sha1Verifier"));
var import_base64Sha256Verifier = __toESM(require("./base64Sha256Verifier"));
var import_jwtVerifier = __toESM(require("./jwtVerifier"));
var import_secretKeyVerifier = __toESM(require("./secretKeyVerifier"));
var import_sha1Verifier = __toESM(require("./sha1Verifier"));
var import_sha256Verifier = __toESM(require("./sha256Verifier"));
var import_skipVerifier = __toESM(require("./skipVerifier"));
var import_timestampSchemeVerifier = __toESM(require("./timestampSchemeVerifier"));
const verifierLookup = {
  skipVerifier: import_skipVerifier.default,
  secretKeyVerifier: import_secretKeyVerifier.default,
  sha1Verifier: import_sha1Verifier.default,
  sha256Verifier: import_sha256Verifier.default,
  base64Sha1Verifier: import_base64Sha1Verifier.default,
  base64Sha256Verifier: import_base64Sha256Verifier.default,
  timestampSchemeVerifier: import_timestampSchemeVerifier.default,
  jwtVerifier: import_jwtVerifier.default
};
const DEFAULT_WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? "";
const VERIFICATION_ERROR_MESSAGE = "You don't have access to invoke this function.";
const VERIFICATION_SIGN_MESSAGE = "Unable to sign payload";
const FIVE_MINUTES = 5 * 6e4;
const DEFAULT_TOLERANCE = FIVE_MINUTES;
class WebhookError extends Error {
  /**
   * Create a WebhookError.
   * @param {string} message - The error message
   * */
  constructor(message) {
    super(message);
  }
}
class WebhookVerificationError extends WebhookError {
  /**
   * Create a WebhookVerificationError.
   * @param {string} message - The error message
   * */
  constructor(message) {
    super(message || VERIFICATION_ERROR_MESSAGE);
  }
}
class WebhookSignError extends WebhookError {
  /**
   * Create a WebhookSignError.
   * @param {string} message - The error message
   * */
  constructor(message) {
    super(message || VERIFICATION_SIGN_MESSAGE);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_TOLERANCE,
  DEFAULT_WEBHOOK_SECRET,
  VERIFICATION_ERROR_MESSAGE,
  VERIFICATION_SIGN_MESSAGE,
  WebhookSignError,
  WebhookVerificationError,
  verifierLookup
});
