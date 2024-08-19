"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var store_exports = {};
__export(store_exports, {
  getAsyncStoreInstance: () => getAsyncStoreInstance
});
module.exports = __toCommonJS(store_exports);
var import_async_hooks = require("async_hooks");
let CONTEXT_STORAGE;
const getAsyncStoreInstance = () => {
  if (!CONTEXT_STORAGE) {
    CONTEXT_STORAGE = new import_async_hooks.AsyncLocalStorage();
  }
  return CONTEXT_STORAGE;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getAsyncStoreInstance
});
