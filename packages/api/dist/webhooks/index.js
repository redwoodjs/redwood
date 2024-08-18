"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
_Object$defineProperty(exports, "DEFAULT_WEBHOOK_SECRET", {
  enumerable: true,
  get: function () {
    return _verifiers.DEFAULT_WEBHOOK_SECRET;
  }
});
exports.DEFAULT_WEBHOOK_SIGNATURE_HEADER = void 0;
_Object$defineProperty(exports, "SupportedVerifierTypes", {
  enumerable: true,
  get: function () {
    return _verifiers.SupportedVerifierTypes;
  }
});
_Object$defineProperty(exports, "VerifyOptions", {
  enumerable: true,
  get: function () {
    return _verifiers.VerifyOptions;
  }
});
_Object$defineProperty(exports, "WebhookVerificationError", {
  enumerable: true,
  get: function () {
    return _verifiers.WebhookVerificationError;
  }
});
exports.verifySignature = exports.verifyEvent = exports.signatureFromEvent = exports.signPayload = void 0;
var _now = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/date/now"));
var _verifiers = require("../auth/verifiers");
const DEFAULT_WEBHOOK_SIGNATURE_HEADER = exports.DEFAULT_WEBHOOK_SIGNATURE_HEADER = 'RW-WEBHOOK-SIGNATURE';

/**
 * Extracts body payload from event with base64 encoding check
 *
 */
const eventBody = event => {
  if (event.isBase64Encoded) {
    return Buffer.from(event.body || '', 'base64').toString('utf-8');
  } else {
    return event.body || '';
  }
};

/**
 * Extracts signature from Lambda Event.
 *
 * @param {APIGatewayProxyEvent} event - The event that includes the request details, like headers
 * @param {string} signatureHeader - The name of header key that contains the signature; defaults to DEFAULT_WEBHOOK_SIGNATURE_HEADER
 * @return {string} - The signature found in the headers specified by signatureHeader
 *
 * @example
 *
 *    signatureFromEvent({ event: event })
 */
const signatureFromEvent = ({
  event,
  signatureHeader = DEFAULT_WEBHOOK_SIGNATURE_HEADER
}) => {
  const header = signatureHeader.toLocaleLowerCase();
  return event.headers[header];
};

/**
 * Verifies event payload is signed with a valid webhook signature.
 *
 * @param {APIGatewayProxyEvent} event - The event that includes the body for the verification payload and request details, like headers.
 * @param {string} payload - If provided, the payload will be used to verify the signature instead of the event body.
 * @param {string} secret - The secret that will verify the signature according to the verifier type
 * @param {VerifyOptions} options - Options to specify the verifier type the header key that contains the signature, timestamp leeway.
 * @return {boolean | WebhookVerificationError} - Returns true if the signature is verified, or raises WebhookVerificationError.
 *
 * @example
 *
 *    verifyEvent({ event: event, options: {} })*
 */
exports.signatureFromEvent = signatureFromEvent;
const verifyEvent = (type, {
  event,
  payload,
  secret = _verifiers.DEFAULT_WEBHOOK_SECRET,
  options
}) => {
  let body = '';
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
    const timestamp = options?.currentTimestampOverride ?? (0, _now.default)();
    const difference = Math.abs(timestamp - options?.eventTimestamp);
    const tolerance = options?.tolerance ?? _verifiers.DEFAULT_TOLERANCE;
    if (difference > tolerance) {
      throw new _verifiers.WebhookVerificationError();
    }
  }
  const {
    verify
  } = (0, _verifiers.createVerifier)(type, options);
  return verify({
    payload: body,
    secret,
    signature
  });
};

/**
 * Standalone verification of webhook signature given a payload, secret, verifier type and options.
 *
 * @param {string} payload - Body content of the event
 * @param {string} secret - The secret that will verify the signature according to the verifier type
 * @param {string} signature - Signature that verifies that the event
 * @param {VerifyOptions} options - Options to specify the verifier type the header key that contains the signature, timestamp leeway.
 * @return {boolean | WebhookVerificationError} - Returns true if the signature is verified, or raises WebhookVerificationError.
 *
 * @example
 *
 *    verifySignature({ payload, secret, signature, options: {} })*
 */
exports.verifyEvent = verifyEvent;
const verifySignature = (type, {
  payload,
  secret = _verifiers.DEFAULT_WEBHOOK_SECRET,
  signature,
  options
}) => {
  const {
    verify
  } = (0, _verifiers.createVerifier)(type, options);
  return verify({
    payload,
    secret,
    signature
  });
};

/**
 * Signs a payload with a secret and verifier type method
 *
 * @param {string} payload - Body content of the event to sign
 * @param {string} secret - The secret that will verify the signature according to the verifier type
 * @param {VerifyOptions} options - Options to specify the verifier type the header key that contains the signature, timestamp leeway.
 * @return {string} - Returns signature
 *
 * @example
 *
 *    signPayload({ payload, secret, options: {} })*
 */
exports.verifySignature = verifySignature;
const signPayload = (type, {
  payload,
  secret = _verifiers.DEFAULT_WEBHOOK_SECRET,
  options
}) => {
  const {
    sign
  } = (0, _verifiers.createVerifier)(type, options);
  return sign({
    payload,
    secret
  });
};
exports.signPayload = signPayload;