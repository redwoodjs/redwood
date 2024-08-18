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
var InMemoryClient_exports = {};
__export(InMemoryClient_exports, {
  default: () => InMemoryClient
});
module.exports = __toCommonJS(InMemoryClient_exports);
var import_BaseClient = __toESM(require("./BaseClient"));
class InMemoryClient extends import_BaseClient.default {
  storage;
  // initialize with pre-cached data if needed
  constructor(data = {}) {
    super();
    this.storage = data;
  }
  /**
   * Special function for testing, only available in InMemoryClient
   *
   * Returns deserialized content of cache as an array of values (without cache keys)
   *
   */
  get contents() {
    return Object.values(this.storage).map(
      (cacheObj) => JSON.parse(cacheObj.value)
    );
  }
  // Not needed for InMemoryClient
  async disconnect() {
  }
  async connect() {
  }
  async get(key) {
    const now = /* @__PURE__ */ new Date();
    if (this.storage[key] && this.storage[key].expires > now.getTime()) {
      return JSON.parse(this.storage[key].value);
    } else {
      delete this.storage[key];
      return null;
    }
  }
  // stores expiration dates as epoch
  async set(key, value, options = {}) {
    const now = /* @__PURE__ */ new Date();
    now.setSeconds(now.getSeconds() + (options?.expires || 31536e4));
    const data = { expires: now.getTime(), value: JSON.stringify(value) };
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
    for (const [cacheKey, cacheObj] of Object.entries(this.storage)) {
      if (cacheObj.value === JSON.stringify(value)) {
        return cacheKey;
      }
    }
    return null;
  }
  isCached(value) {
    return !!this.cacheKeyForValue(value);
  }
}
