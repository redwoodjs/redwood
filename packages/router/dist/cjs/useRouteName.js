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
var useRouteName_exports = {};
__export(useRouteName_exports, {
  useRouteName: () => useRouteName
});
module.exports = __toCommonJS(useRouteName_exports);
var import_router_context = require("./router-context.js");
var import_index = require("./index.js");
function useRouteName() {
  const routerState = (0, import_router_context.useRouterState)();
  const routeName = routerState.activeRouteName;
  if (isAvailableRouteName(routeName)) {
    return routeName;
  }
  return void 0;
}
function isAvailableRouteName(name) {
  return typeof name === "string" && Object.keys(import_index.routes).includes(name);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useRouteName
});
