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
var sha1Verifier_exports = {};
__export(sha1Verifier_exports, {
  default: () => sha1Verifier_default,
  verifySignature: () => verifySignature
});
module.exports = __toCommonJS(sha1Verifier_exports);
var import_crypto = require("crypto");
var import_common = require("./common");
function toNormalizedJsonString(payload) {
  return JSON.stringify(payload).replace(/[^\\]\\u[\da-f]{4}/g, (s) => {
    return s.substr(0, 3) + s.substr(3).toUpperCase();
  });
}
const createSignature = ({
  payload,
  secret = import_common.DEFAULT_WEBHOOK_SECRET
}) => {
  const algorithm = "sha1";
  const hmac = (0, import_crypto.createHmac)(algorithm, secret);
  payload = typeof payload === "string" ? payload : toNormalizedJsonString(payload);
  const digest = Buffer.from(
    algorithm + "=" + hmac.update(payload).digest("hex"),
    "utf8"
  );
  return digest.toString();
};
const verifySignature = ({
  payload,
  secret = import_common.DEFAULT_WEBHOOK_SECRET,
  signature
}) => {
  try {
    const algorithm = signature.split("=")[0];
    const webhookSignature = Buffer.from(signature || "", "utf8");
    const hmac = (0, import_crypto.createHmac)(algorithm, secret);
    payload = typeof payload === "string" ? payload : toNormalizedJsonString(payload);
    const digest = Buffer.from(
      algorithm + "=" + hmac.update(payload).digest("hex"),
      "utf8"
    );
    const verified = webhookSignature.length === digest.length && (0, import_crypto.timingSafeEqual)(digest, webhookSignature);
    if (verified) {
      return verified;
    }
    throw new import_common.WebhookVerificationError();
  } catch (error) {
    throw new import_common.WebhookVerificationError(
      `${import_common.VERIFICATION_ERROR_MESSAGE}: ${error.message}`
    );
  }
};
const sha1Verifier = (_options) => {
  return {
    sign: ({ payload, secret }) => {
      return createSignature({ payload, secret });
    },
    verify: ({ payload, secret, signature }) => {
      return verifySignature({ payload, secret, signature });
    },
    type: "sha1Verifier"
  };
};
var sha1Verifier_default = sha1Verifier;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  verifySignature
});
