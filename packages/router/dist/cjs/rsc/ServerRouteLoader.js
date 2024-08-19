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
var ServerRouteLoader_exports = {};
__export(ServerRouteLoader_exports, {
  ServerRouteLoader: () => ServerRouteLoader
});
module.exports = __toCommonJS(ServerRouteLoader_exports);
var import_react = __toESM(require("react"), 1);
const ServerRouteLoader = ({ spec, params }) => {
  const LazyRouteComponent = spec.LazyComponent;
  if (params) {
    delete params["ref"];
    delete params["key"];
  }
  return /* @__PURE__ */ import_react.default.createElement(import_react.Suspense, { fallback: /* @__PURE__ */ import_react.default.createElement("div", null, "Loading...") }, /* @__PURE__ */ import_react.default.createElement(LazyRouteComponent, { ...params }), /* @__PURE__ */ import_react.default.createElement(
    "div",
    {
      id: "redwood-announcer",
      style: {
        position: "absolute",
        top: 0,
        width: 1,
        height: 1,
        padding: 0,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0
      },
      role: "alert",
      "aria-live": "assertive",
      "aria-atomic": "true"
    }
  ));
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ServerRouteLoader
});
