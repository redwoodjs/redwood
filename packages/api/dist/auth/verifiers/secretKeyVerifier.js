"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _common = require("./common");
/**
 *
 * Secret Key Verifier
 *
 * Use when the payload is not signed, but rather authorized via a known secret key
 *
 */
const secretKeyVerifier = _options => {
  return {
    sign: ({
      secret
    }) => {
      return secret;
    },
    verify: ({
      signature,
      secret = _common.DEFAULT_WEBHOOK_SECRET
    }) => {
      const verified = signature === secret;
      if (!verified) {
        throw new _common.WebhookVerificationError();
      }
      return verified;
    },
    type: 'secretKeyVerifier'
  };
};
var _default = exports.default = secretKeyVerifier;