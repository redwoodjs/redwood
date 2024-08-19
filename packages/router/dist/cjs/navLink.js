"use strict";
"use client";
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
var navLink_exports = {};
__export(navLink_exports, {
  NavLink: () => NavLink
});
module.exports = __toCommonJS(navLink_exports);
var import_react = __toESM(require("react"), 1);
var import_link = require("./link.js");
var import_useMatch = require("./useMatch.js");
var import_util = require("./util.js");
const NavLink = (0, import_react.forwardRef)(
  ({
    to,
    activeClassName,
    activeMatchParams,
    matchSubPaths,
    className,
    onClick,
    ...rest
  }, ref) => {
    const [pathname, queryString] = to.split("?");
    const searchParams = activeMatchParams || (0, import_util.flattenSearchParams)(queryString);
    const matchInfo = (0, import_useMatch.useMatch)(pathname, {
      searchParams,
      matchSubPaths
    });
    return /* @__PURE__ */ import_react.default.createElement(
      import_link.Link,
      {
        ref,
        to,
        onClick,
        className: matchInfo.match ? activeClassName : className,
        ...rest
      }
    );
  }
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NavLink
});
