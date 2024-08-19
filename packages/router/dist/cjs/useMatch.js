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
var useMatch_exports = {};
__export(useMatch_exports, {
  useMatch: () => useMatch
});
module.exports = __toCommonJS(useMatch_exports);
var import_location = require("./location.js");
var import_util = require("./util.js");
const useMatch = (routePath, options) => {
  const location = (0, import_location.useLocation)();
  if (!location) {
    return { match: false };
  }
  if (options?.searchParams) {
    const locationParams = new URLSearchParams(location.search);
    const hasUnmatched = options.searchParams.some((param) => {
      if (typeof param === "string") {
        return !locationParams.has(param);
      } else {
        return Object.keys(param).some(
          (key) => param[key] != locationParams.get(key)
        );
      }
    });
    if (hasUnmatched) {
      return { match: false };
    }
  }
  const matchInfo = (0, import_util.matchPath)(routePath, location.pathname, {
    matchSubPaths: options?.matchSubPaths
  });
  if (!matchInfo.match) {
    return { match: false };
  }
  const routeParams = Object.entries(options?.routeParams || {});
  if (routeParams.length > 0) {
    if (!isMatchWithParams(matchInfo) || !matchInfo.params) {
      return { match: false };
    }
    const isParamMatch = routeParams.every(([key, value]) => {
      return matchInfo.params[key] === value;
    });
    if (!isParamMatch) {
      return { match: false };
    }
  }
  return matchInfo;
};
function isMatchWithParams(match) {
  return match !== null && typeof match === "object" && "params" in match;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useMatch
});
