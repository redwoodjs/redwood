"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.verifySignature = exports.jwtVerifier = exports.default = void 0;
var _jsonwebtoken = _interopRequireDefault(require("jsonwebtoken"));
var _common = require("./common");
/**
 *
 * createSignature
 *
 */
const createSignature = ({
  payload,
  secret = _common.DEFAULT_WEBHOOK_SECRET,
  options
}) => {
  try {
    const signOptions = options?.issuer ? {
      issuer: options?.issuer
    } : undefined;
    return _jsonwebtoken.default.sign(payload, secret, {
      ...signOptions
    });
  } catch (error) {
    throw new _common.WebhookSignError(error.message);
  }
};

/**
 *
 * verifySignature
 *
 */
const verifySignature = ({
  payload,
  secret = _common.DEFAULT_WEBHOOK_SECRET,
  signature,
  options
}) => {
  try {
    if (payload === undefined || payload?.length === 0) {
      console.warn('Missing payload');
    }
    if (options?.issuer) {
      _jsonwebtoken.default.verify(signature, secret, {
        issuer: options?.issuer
      });
    } else {
      _jsonwebtoken.default.verify(signature, secret);
    }
    return true;
  } catch {
    throw new _common.WebhookVerificationError();
  }
};

/**
 *
 * JWT Payload Verifier
 *
 * Based on Netlify's webhook payload verification
 * @see: https://docs.netlify.com/site-deploys/notifications/#payload-signature
 *
 */
exports.verifySignature = verifySignature;
const jwtVerifier = options => {
  return {
    sign: ({
      payload,
      secret
    }) => {
      return createSignature({
        payload,
        secret,
        options
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
    type: 'jwtVerifier'
  };
};
exports.jwtVerifier = jwtVerifier;
var _default = exports.default = jwtVerifier;