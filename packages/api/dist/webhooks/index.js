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
var webhooks_exports = {};
__export(webhooks_exports, {
  DEFAULT_WEBHOOK_SECRET: () => import_verifiers2.DEFAULT_WEBHOOK_SECRET,
  DEFAULT_WEBHOOK_SIGNATURE_HEADER: () => DEFAULT_WEBHOOK_SIGNATURE_HEADER,
  SupportedVerifierTypes: () => import_verifiers2.SupportedVerifierTypes,
  VerifyOptions: () => import_verifiers2.VerifyOptions,
  WebhookVerificationError: () => import_verifiers2.WebhookVerificationError,
  signPayload: () => signPayload,
  signatureFromEvent: () => signatureFromEvent,
  verifyEvent: () => verifyEvent,
  verifySignature: () => verifySignature
});
module.exports = __toCommonJS(webhooks_exports);
var import_verifiers = require("../auth/verifiers");
var import_verifiers2 = require("../auth/verifiers");
const DEFAULT_WEBHOOK_SIGNATURE_HEADER = "RW-WEBHOOK-SIGNATURE";
const eventBody = (event) => {
  if (event.isBase64Encoded) {
    return Buffer.from(event.body || "", "base64").toString("utf-8");
  } else {
    return event.body || "";
  }
};
const signatureFromEvent = ({
  event,
  signatureHeader = DEFAULT_WEBHOOK_SIGNATURE_HEADER
}) => {
  const header = signatureHeader.toLocaleLowerCase();
  return event.headers[header];
};
const verifyEvent = (type, {
  event,
  payload,
  secret = import_verifiers.DEFAULT_WEBHOOK_SECRET,
  options
}) => {
  let body = "";
  if (payload) {
    body = payload;
  } else {
    body = eventBody(event);
  }
  let signature = signatureFromEvent({
    event,
    signatureHeader: options?.signatureHeader || DEFAULT_WEBHOOK_SIGNATURE_HEADER
  });
  if (options?.signatureTransformer) {
    signature = options.signatureTransformer(signature);
  }
  if (options?.eventTimestamp) {
    const timestamp = options?.currentTimestampOverride ?? Date.now();
    const difference = Math.abs(timestamp - options?.eventTimestamp);
    const tolerance = options?.tolerance ?? import_verifiers.DEFAULT_TOLERANCE;
    if (difference > tolerance) {
      throw new import_verifiers.WebhookVerificationError();
    }
  }
  const { verify } = (0, import_verifiers.createVerifier)(type, options);
  return verify({ payload: body, secret, signature });
};
const verifySignature = (type, {
  payload,
  secret = import_verifiers.DEFAULT_WEBHOOK_SECRET,
  signature,
  options
}) => {
  const { verify } = (0, import_verifiers.createVerifier)(type, options);
  return verify({ payload, secret, signature });
};
const signPayload = (type, {
  payload,
  secret = import_verifiers.DEFAULT_WEBHOOK_SECRET,
  options
}) => {
  const { sign } = (0, import_verifiers.createVerifier)(type, options);
  return sign({ payload, secret });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_WEBHOOK_SECRET,
  DEFAULT_WEBHOOK_SIGNATURE_HEADER,
  SupportedVerifierTypes,
  VerifyOptions,
  WebhookVerificationError,
  signPayload,
  signatureFromEvent,
  verifyEvent,
  verifySignature
});
