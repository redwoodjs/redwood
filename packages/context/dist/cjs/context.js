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
var context_exports = {};
__export(context_exports, {
  context: () => context,
  createContextProxy: () => createContextProxy,
  setContext: () => setContext
});
module.exports = __toCommonJS(context_exports);
var import_store = require("./store.js");
const createContextProxy = (target) => {
  return new Proxy(target, {
    get: (_target, property) => {
      const store = (0, import_store.getAsyncStoreInstance)().getStore();
      const ctx = store?.get("context") || {};
      return ctx[property];
    },
    set: (_target, property, newVal) => {
      const store = (0, import_store.getAsyncStoreInstance)().getStore();
      const ctx = store?.get("context") || {};
      ctx[property] = newVal;
      store?.set("context", ctx);
      return true;
    }
  });
};
let context = createContextProxy({});
const setContext = (newContext) => {
  context = createContextProxy(newContext);
  const store = (0, import_store.getAsyncStoreInstance)().getStore();
  store?.set("context", newContext);
  return context;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  context,
  createContextProxy,
  setContext
});
