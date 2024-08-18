"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
/**
 * skipVerifier skips webhook signature verification.
 * Use when there is no signature provided or the webhook is
 * entirely public.
 *
 */
const skipVerifier = _options => {
  return {
    sign: () => {
      console.warn(`No signature is created for the skipVerifier verifier`);
      return '';
    },
    verify: () => {
      console.warn(`The skipVerifier verifier considers all signatures valid`);
      return true;
    },
    type: 'skipVerifier'
  };
};
var _default = exports.default = skipVerifier;