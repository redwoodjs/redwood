"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.verifySignature = exports.default = void 0;
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
var _slice = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/slice"));
var _crypto = require("crypto");
var _common = require("./common");
function toNormalizedJsonString(payload) {
  return (0, _stringify.default)(payload).replace(/[^\\]\\u[\da-f]{4}/g, s => {
    return (0, _slice.default)(s).call(s, 0, 3) + (0, _slice.default)(s).call(s, 3).toUpperCase();
  });
}
const createSignature = ({
  payload,
  secret = _common.DEFAULT_WEBHOOK_SECRET
}) => {
  const algorithm = 'sha256';
  const hmac = (0, _crypto.createHmac)(algorithm, Buffer.from(secret, 'base64'));
  payload = typeof payload === 'string' ? payload : toNormalizedJsonString(payload);
  const digest = hmac.update(payload).digest();
  return digest.toString('base64');
};
const verifySignature = ({
  payload,
  secret = _common.DEFAULT_WEBHOOK_SECRET,
  signature
}) => {
  try {
    const webhookSignature = Buffer.from(signature || '', 'base64');
    const hmac = (0, _crypto.createHmac)('sha256', Buffer.from(secret, 'base64'));
    payload = typeof payload === 'string' ? payload : toNormalizedJsonString(payload);
    const digest = hmac.update(payload).digest();

    // constant time comparison to prevent timing attacks
    // https://stackoverflow.com/a/31096242/206879
    // https://en.wikipedia.org/wiki/Timing_attack
    if (webhookSignature.length === digest.length && (0, _crypto.timingSafeEqual)(digest, webhookSignature)) {
      return true;
    }
    throw new _common.WebhookVerificationError();
  } catch (error) {
    throw new _common.WebhookVerificationError(`${_common.VERIFICATION_ERROR_MESSAGE}: ${error.message}`);
  }
};

/**
 * Base64 SHA256 HMAC Payload Verifier
 *
 * Based on Svix's webhook payload verification
 * @see https://docs.svix.com/receiving/verifying-payloads/how-manual
 * @see https://github.com/svix/svix-webhooks/blob/main/javascript/src/index.ts
 */
exports.verifySignature = verifySignature;
const base64Sha256Verifier = _options => {
  return {
    sign: ({
      payload,
      secret
    }) => {
      return createSignature({
        payload,
        secret
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
        signature
      });
    },
    type: 'base64Sha256Verifier'
  };
};
var _default = exports.default = base64Sha256Verifier;