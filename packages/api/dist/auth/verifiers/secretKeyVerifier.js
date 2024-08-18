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
var secretKeyVerifier_exports = {};
__export(secretKeyVerifier_exports, {
  default: () => secretKeyVerifier_default
});
module.exports = __toCommonJS(secretKeyVerifier_exports);
var import_common = require("./common");
const secretKeyVerifier = (_options) => {
  return {
    sign: ({ secret }) => {
      return secret;
    },
    verify: ({ signature, secret = import_common.DEFAULT_WEBHOOK_SECRET }) => {
      const verified = signature === secret;
      if (!verified) {
        throw new import_common.WebhookVerificationError();
      }
      return verified;
    },
    type: "secretKeyVerifier"
  };
};
var secretKeyVerifier_default = secretKeyVerifier;
