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
var timestampSchemeVerifier_exports = {};
__export(timestampSchemeVerifier_exports, {
  default: () => timestampSchemeVerifier_default
});
module.exports = __toCommonJS(timestampSchemeVerifier_exports);
var import_crypto = require("crypto");
var import_common = require("./common");
const getHmac = ({ secret }) => {
  if (typeof secret === "undefined" || secret === "") {
    throw new import_common.WebhookVerificationError();
  }
  return (0, import_crypto.createHmac)("sha256", secret);
};
const createSignature = ({
  payload,
  secret = import_common.DEFAULT_WEBHOOK_SECRET,
  timestamp = Date.now()
}) => {
  const hmac = getHmac({ secret });
  hmac.update(timestamp + "." + payload);
  return `t=${timestamp},v1=${hmac.digest("hex")}`;
};
const verifySignature = ({
  payload,
  secret = import_common.DEFAULT_WEBHOOK_SECRET,
  signature,
  options
}) => {
  const match = /t=(\d+),v1=([\da-f]+)/.exec(signature);
  if (!match) {
    throw new import_common.WebhookVerificationError();
  }
  const signedStamp = Number(match[1]);
  const signedPayload = match[2];
  const timestamp = options?.currentTimestampOverride ?? Date.now();
  const tolerance = options?.tolerance ?? import_common.DEFAULT_TOLERANCE;
  const difference = Math.abs(timestamp - signedStamp);
  if (difference > tolerance) {
    throw new import_common.WebhookVerificationError();
  }
  const hmac = getHmac({ secret });
  hmac.update(signedStamp + "." + payload);
  if (hmac.digest("hex") === signedPayload) {
    return true;
  }
  throw new import_common.WebhookVerificationError();
};
const timestampSchemeVerifier = (options) => {
  return {
    sign: ({ payload, secret }) => {
      return createSignature({
        payload,
        secret,
        timestamp: options?.currentTimestampOverride
      });
    },
    verify: ({ payload, secret, signature }) => {
      return verifySignature({ payload, secret, signature, options });
    },
    type: "timestampSchemeVerifier"
  };
};
var timestampSchemeVerifier_default = timestampSchemeVerifier;
