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
var base64Sha256Verifier_exports = {};
__export(base64Sha256Verifier_exports, {
  default: () => base64Sha256Verifier_default,
  verifySignature: () => verifySignature
});
module.exports = __toCommonJS(base64Sha256Verifier_exports);
var import_crypto = require("crypto");
var import_common = require("./common");
function toNormalizedJsonString(payload) {
  return JSON.stringify(payload).replace(/[^\\]\\u[\da-f]{4}/g, (s) => {
    return s.slice(0, 3) + s.slice(3).toUpperCase();
  });
}
const createSignature = ({
  payload,
  secret = import_common.DEFAULT_WEBHOOK_SECRET
}) => {
  const algorithm = "sha256";
  const hmac = (0, import_crypto.createHmac)(algorithm, Buffer.from(secret, "base64"));
  payload = typeof payload === "string" ? payload : toNormalizedJsonString(payload);
  const digest = hmac.update(payload).digest();
  return digest.toString("base64");
};
const verifySignature = ({
  payload,
  secret = import_common.DEFAULT_WEBHOOK_SECRET,
  signature
}) => {
  try {
    const webhookSignature = Buffer.from(signature || "", "base64");
    const hmac = (0, import_crypto.createHmac)("sha256", Buffer.from(secret, "base64"));
    payload = typeof payload === "string" ? payload : toNormalizedJsonString(payload);
    const digest = hmac.update(payload).digest();
    if (webhookSignature.length === digest.length && (0, import_crypto.timingSafeEqual)(digest, webhookSignature)) {
      return true;
    }
    throw new import_common.WebhookVerificationError();
  } catch (error) {
    throw new import_common.WebhookVerificationError(
      `${import_common.VERIFICATION_ERROR_MESSAGE}: ${error.message}`
    );
  }
};
const base64Sha256Verifier = (_options) => {
  return {
    sign: ({ payload, secret }) => {
      return createSignature({ payload, secret });
    },
    verify: ({ payload, secret, signature }) => {
      return verifySignature({ payload, secret, signature });
    },
    type: "base64Sha256Verifier"
  };
};
var base64Sha256Verifier_default = base64Sha256Verifier;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  verifySignature
});
