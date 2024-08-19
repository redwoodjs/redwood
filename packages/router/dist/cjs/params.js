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
var params_exports = {};
__export(params_exports, {
  ParamsContext: () => ParamsContext,
  ParamsProvider: () => ParamsProvider,
  useParams: () => useParams
});
module.exports = __toCommonJS(params_exports);
var import_react = __toESM(require("react"), 1);
var import_createNamedContext = require("./createNamedContext.js");
const ParamsContext = (0, import_createNamedContext.createNamedContext)("Params");
const ParamsProvider = ({ allParams, children }) => {
  return /* @__PURE__ */ import_react.default.createElement(
    ParamsContext.Provider,
    {
      value: {
        params: {
          ...allParams
        }
      }
    },
    children
  );
};
const useParams = () => {
  const paramsContext = (0, import_react.useContext)(ParamsContext);
  if (paramsContext === void 0) {
    throw new Error("useParams must be used within a ParamsProvider");
  }
  return paramsContext.params;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParamsContext,
  ParamsProvider,
  useParams
});
