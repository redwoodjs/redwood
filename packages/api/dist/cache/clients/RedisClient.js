"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var RedisClient_exports = {};
__export(RedisClient_exports, {
  default: () => RedisClient
});
module.exports = __toCommonJS(RedisClient_exports);
var import_BaseClient = __toESM(require("./BaseClient"));
class RedisClient extends import_BaseClient.default {
  client;
  logger;
  redisOptions;
  constructor(options) {
    const { logger, ...redisOptions } = options;
    super();
    this.logger = logger;
    this.redisOptions = redisOptions;
  }
  async connect() {
    const { createClient } = await import("redis");
    this.client = createClient(this.redisOptions);
    this.client.on(
      "error",
      (err) => this.logger?.error(err) || console.error(err)
    );
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
    return this.client?.set(key, JSON.stringify(value), setOptions);
  }
  async del(key) {
    if (!this.client) {
      await this.connect();
    }
    return !!await this.client?.del([key]);
  }
}
