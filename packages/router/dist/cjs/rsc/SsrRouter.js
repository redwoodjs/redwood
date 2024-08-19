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
var SsrRouter_exports = {};
__export(SsrRouter_exports, {
  Router: () => Router
});
module.exports = __toCommonJS(SsrRouter_exports);
var import_react = __toESM(require("react"), 1);
var import_analyzeRoutes = require("../analyzeRoutes.js");
var import_location = require("../location.js");
var import_namedRoutes = require("../namedRoutes.js");
var import_clientSsr = require("./clientSsr.js");
const Router = ({ paramTypes, children }) => {
  return /* @__PURE__ */ import_react.default.createElement(import_location.LocationProvider, null, /* @__PURE__ */ import_react.default.createElement(LocationAwareRouter, { paramTypes }, children));
};
const LocationAwareRouter = ({ paramTypes, children }) => {
  const { pathname } = (0, import_location.useLocation)();
  const { namedRoutesMap } = (0, import_react.useMemo)(() => {
    return (0, import_analyzeRoutes.analyzeRoutes)(children, {
      currentPathName: pathname,
      userParamTypes: paramTypes
    });
  }, [pathname, children, paramTypes]);
  Object.assign(import_namedRoutes.namedRoutes, namedRoutesMap);
  return (0, import_clientSsr.renderRoutesFromDist)(pathname);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Router
});
