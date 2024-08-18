"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _now = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/date/now"));
var _crypto = require("crypto");
var _common = require("./common");
/**
 * Generates a hash-based message authentication code from a secret.
 *
 * @param {string} secret - Secret key used to sign
 * @return {string} - A HMAC
 *
 * @example
 *
 *    getHmac({ secret: 'MY_SECRET' })
 */
const getHmac = ({
  secret
}) => {
  if (typeof secret === 'undefined' || secret === '') {
    throw new _common.WebhookVerificationError();
  }
  return (0, _crypto.createHmac)('sha256', secret);
};

/*
 * The Redwood-Webhook-Signature header included in each signed event contains a timestamp and one or more signatures.
 * The timestamp is prefixed by t=, and each signature is prefixed by a scheme. Schemes start with v, followed by an integer.
 * Currently, the only valid live signature scheme is v1.
 *
 * The signed_payload string is created by concatenating:
 *
 * The timestamp (as a string)
 * The character .
 * The actual JSON payload (i.e., the request body)
 *
 * @param {string} payload - The body payload to sign.
 * @param {string} secret - The secret key used to sign. Defaults to DEFAULT_WEBHOOK_SECRET.
 * @param {number} timestamp - Timestamp in msec used to sign. Defaults to now.
 * @return {string} - The signature
 *
 * @example
 *
 *    sign({ payload: 'This is some content to sign.' })
 */
const createSignature = ({
  payload,
  secret = _common.DEFAULT_WEBHOOK_SECRET,
  timestamp = (0, _now.default)()
}) => {
  const hmac = getHmac({
    secret
  });
  hmac.update(timestamp + '.' + payload);
  return `t=${timestamp},v1=${hmac.digest('hex')}`;
};

/**
 * Logic to verify the body payload with a given signature.
 *
 * The value for the prefix t corresponds to the timestamp, and v1 corresponds to the signature (or signatures).
 *
 * Compare the signature (or signatures) in the header to the expected signature.
 * For an equality match, we compute the difference between the current timestamp and the received timestamp,
 * then decide if the difference is within your tolerance -- in our case this is 5 minutes.
 *
 * Because this timestamp is part of the signed payload, it is also verified by the signature,
 * so an attacker cannot change the timestamp without invalidating the signature.
 * If the signature is valid but the timestamp is too old, we reject the payload.
 *
 * This tolerance protects against timing attacks by comparing the expected signature to each of the received signatures.
 *
 * @param {string} payload - The body payload.
 * @param {string} secret - The secret key used to sign. Defaults to DEFAULT_WEBHOOK_SECRET.
 * @param {string} signature - The signature.
 * @param {VerifyOptions} options - Options for verifying the timestamp leeway.
 * @return {boolean \ WebhookVerificationError} - Returns true if the signature is verified, or raises WebhookVerificationError.
 *
 * @example
 *
 *    verifySignature({ payload: event,
 *                      signature: 't=1535555109,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd`',
 *                      options: {} })
 */
const verifySignature = ({
  payload,
  secret = _common.DEFAULT_WEBHOOK_SECRET,
  signature,
  options
}) => {
  const match = /t=(\d+),v1=([\da-f]+)/.exec(signature);
  if (!match) {
    throw new _common.WebhookVerificationError();
  }
  const signedStamp = Number(match[1]);
  const signedPayload = match[2];
  const timestamp = options?.currentTimestampOverride ?? (0, _now.default)();
  const tolerance = options?.tolerance ?? _common.DEFAULT_TOLERANCE;
  const difference = Math.abs(timestamp - signedStamp);
  if (difference > tolerance) {
    throw new _common.WebhookVerificationError();
  }
  const hmac = getHmac({
    secret
  });
  hmac.update(signedStamp + '.' + payload);
  if (hmac.digest('hex') === signedPayload) {
    return true;
  }
  throw new _common.WebhookVerificationError();
};

/**
 *
 * Timestamp & Scheme Verifier
 *
 * Based on Stripe's secure webhook implementation
 *
 * @see https://stripe.com/docs/webhooks/signatures
 *
 */
const timestampSchemeVerifier = options => {
  return {
    sign: ({
      payload,
      secret
    }) => {
      return createSignature({
        payload,
        secret,
        timestamp: options?.currentTimestampOverride
      });
    },
    verify: ({
      payload,
      secret,
      signature
    }) => {
      return verifySignature({
        payload,
        secret,
        signature,
        options
      });
    },
    type: 'timestampSchemeVerifier'
  };
};
var _default = exports.default = timestampSchemeVerifier;