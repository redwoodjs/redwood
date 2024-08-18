"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
require("core-js/modules/esnext.json.parse.js");
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _values = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/values"));
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
var _entries = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/entries"));
var _BaseClient = _interopRequireDefault(require("./BaseClient"));
// Simple in-memory cache client for testing. NOT RECOMMENDED FOR PRODUCTION

class InMemoryClient extends _BaseClient.default {
  // initialize with pre-cached data if needed
  constructor(data = {}) {
    super();
    this.storage = void 0;
    this.storage = data;
  }

  /**
   * Special function for testing, only available in InMemoryClient
   *
   * Returns deserialized content of cache as an array of values (without cache keys)
   *
   */
  get contents() {
    var _context;
    return (0, _map.default)(_context = (0, _values.default)(this.storage)).call(_context, cacheObj => JSON.parse(cacheObj.value));
  }

  // Not needed for InMemoryClient
  async disconnect() {}
  async connect() {}
  async get(key) {
    const now = new Date();
    if (this.storage[key] && this.storage[key].expires > now.getTime()) {
      return JSON.parse(this.storage[key].value);
    } else {
      delete this.storage[key];
      return null;
    }
  }

  // stores expiration dates as epoch
  async set(key, value, options = {}) {
    const now = new Date();
    now.setSeconds(now.getSeconds() + (options?.expires || 315360000));
    const data = {
      expires: now.getTime(),
      value: (0, _stringify.default)(value)
    };
    this.storage[key] = data;
    return true;
  }
  async del(key) {
    if (this.storage[key]) {
      delete this.storage[key];
      return true;
    } else {
      return false;
    }
  }

  /**
   * Special functions for testing, only available in InMemoryClient
   */
  async clear() {
    this.storage = {};
  }
  cacheKeyForValue(value) {
    for (const [cacheKey, cacheObj] of (0, _entries.default)(this.storage)) {
      if (cacheObj.value === (0, _stringify.default)(value)) {
        return cacheKey;
      }
    }
    return null;
  }
  isCached(value) {
    return !!this.cacheKeyForValue(value);
  }
}
exports.default = InMemoryClient;