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
var MemcachedClient_exports = {};
__export(MemcachedClient_exports, {
  default: () => MemcachedClient
});
module.exports = __toCommonJS(MemcachedClient_exports);
var import_BaseClient = __toESM(require("./BaseClient"));
class MemcachedClient extends import_BaseClient.default {
  client;
  servers;
  options;
  constructor(servers, options) {
    super();
    this.servers = servers;
    this.options = options;
  }
  async connect() {
    const { Client: MemCachedClient } = await import("memjs");
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
    return this.client?.set(key, JSON.stringify(value), options);
  }
  async del(key) {
    if (!this.client) {
      await this.connect();
    }
    return this.client?.delete(key);
  }
}
