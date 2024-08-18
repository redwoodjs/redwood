"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
require("core-js/modules/esnext.json.parse.js");
var _BaseClient = _interopRequireDefault(require("./BaseClient"));
class MemcachedClient extends _BaseClient.default {
  constructor(servers, options) {
    super();
    this.client = void 0;
    this.servers = void 0;
    this.options = void 0;
    this.servers = servers;
    this.options = options;
  }
  async connect() {
    const {
      Client: MemCachedClient
    } = await import('memjs');
    this.client = MemCachedClient.create(this.servers, this.options);
  }
  async disconnect() {
    this.client?.close();
    this.client = null;
  }
  async get(key) {
    if (!this.client) {
      await this.connect();
    }
    const result = await this.client?.get(key);
    if (result?.value) {
      return JSON.parse(result.value.toString());
    } else {
      return result?.value;
    }
  }
  async set(key, value, options) {
    if (!this.client) {
      await this.connect();
    }
    return this.client?.set(key, (0, _stringify.default)(value), options);
  }
  async del(key) {
    if (!this.client) {
      await this.connect();
    }

    // memcached returns true/false natively
    return this.client?.delete(key);
  }
}
exports.default = MemcachedClient;