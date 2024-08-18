"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.verifySignature = exports.default = void 0;
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
var _crypto = require("crypto");
var _common = require("./common");
function toNormalizedJsonString(payload) {
  return (0, _stringify.default)(payload).replace(/[^\\]\\u[\da-f]{4}/g, s => {
    return s.substr(0, 3) + s.substr(3).toUpperCase();
  });
}

/**
 *
 * createSignature
 *
 */
const createSignature = ({
  payload,
  secret = _common.DEFAULT_WEBHOOK_SECRET
}) => {
  const algorithm = 'sha256';
  const hmac = (0, _crypto.createHmac)(algorithm, secret);
  payload = typeof payload === 'string' ? payload : toNormalizedJsonString(payload);
  const digest = Buffer.from(algorithm + '=' + hmac.update(payload).digest('hex'), 'utf8');
  return digest.toString();
};

/**
 *
 * verifySignature
 *
 */
const verifySignature = ({
  payload,
  secret = _common.DEFAULT_WEBHOOK_SECRET,
  signature
}) => {
  try {
    const algorithm = signature.split('=')[0];
    const webhookSignature = Buffer.from(signature || '', 'utf8');
    const hmac = (0, _crypto.createHmac)(algorithm, secret);
    payload = typeof payload === 'string' ? payload : toNormalizedJsonString(payload);
    const digest = Buffer.from(algorithm + '=' + hmac.update(payload).digest('hex'), 'utf8');

    // constant time comparison to prevent timing attacks
    // https://stackoverflow.com/a/31096242/206879
    // https://en.wikipedia.org/wiki/Timing_attack
    const verified = webhookSignature.length === digest.length && (0, _crypto.timingSafeEqual)(digest, webhookSignature);
    if (verified) {
      return verified;
    }
    throw new _common.WebhookVerificationError();
  } catch (error) {
    throw new _common.WebhookVerificationError(`${_common.VERIFICATION_ERROR_MESSAGE}: ${error.message}`);
  }
};

/**
 *
 * SHA256 HMAC Payload Verifier
 *
 * Based on GitHub's webhook payload verification
 * @see https://docs.github.com/en/developers/webhooks-and-events/securing-your-webhooks
 *
 */
exports.verifySignature = verifySignature;
const sha256Verifier = _options => {
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
    type: 'sha256Verifier'
  };
};
var _default = exports.default = sha256Verifier;