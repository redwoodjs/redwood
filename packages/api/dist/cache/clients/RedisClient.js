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
class RedisClient extends _BaseClient.default {
  constructor(options) {
    const {
      logger,
      ...redisOptions
    } = options;
    super();
    this.client = void 0;
    this.logger = void 0;
    this.redisOptions = void 0;
    this.logger = logger;
    this.redisOptions = redisOptions;
  }
  async connect() {
    // async import to make sure Redis isn't imported for MemCache
    const {
      createClient
    } = await import('redis');

    // NOTE: type in redis client does not match the return type of createClient
    this.client = createClient(this.redisOptions);
    this.client.on('error', err => this.logger?.error(err) || console.error(err));
    await this.client.connect();
  }

  // @NOTE: disconnect intentionally not implemented for Redis
  // Because node-redis recovers gracefully from connection loss

  async get(key) {
    if (!this.client) {
      await this.connect();
    }
    const result = await this.client?.get(key);
    return result ? JSON.parse(result) : null;
  }
  async set(key, value, options) {
    const setOptions = {};
    if (!this.client) {
      await this.connect();
    }
    if (options.expires) {
      setOptions.EX = options.expires;
    }
    return this.client?.set(key, (0, _stringify.default)(value), setOptions);
  }
  async del(key) {
    if (!this.client) {
      await this.connect();
    }

    // Redis client returns 0 or 1, so convert to true/false manually
    return !!(await this.client?.del([key]));
  }
}
exports.default = RedisClient;