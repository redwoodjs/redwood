"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.CacheTimeoutError = void 0;
class CacheTimeoutError extends Error {
  constructor() {
    super('Timed out waiting for response from the cache server');
    this.name = 'CacheTimeoutError';
  }
}
exports.CacheTimeoutError = CacheTimeoutError;