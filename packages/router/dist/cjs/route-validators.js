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
var route_validators_exports = {};
__export(route_validators_exports, {
  isNotFoundRoute: () => isNotFoundRoute,
  isRedirectRoute: () => isRedirectRoute,
  isStandardRoute: () => isStandardRoute,
  isValidRoute: () => isValidRoute
});
module.exports = __toCommonJS(route_validators_exports);
var import_react = require("react");
var import_Route = require("./Route.js");
function isNodeTypeRoute(node) {
  return (0, import_react.isValidElement)(node) && node.type === import_Route.Route;
}
function isString(value) {
  return typeof value === "string";
}
function isStandardRoute(node) {
  return !node.props.notfound && !node.props.redirect;
}
function isRedirectRoute(node) {
  return !!node.props.redirect;
}
function isNotFoundRoute(node) {
  return !!node.props.notfound;
}
function isValidRoute(node) {
  const isValidRouteElement = isNodeTypeRoute(node);
  if (isValidRouteElement) {
    const notFoundOrRedirect = node.props.notfound || node.props.redirect;
    const requiredKeys = [
      !node.props.notfound && "path",
      // redirects don't need an actual page, but notfound and standard do
      !node.props.redirect && "page",
      // Redirects can have names, but aren't required to
      !notFoundOrRedirect && "name"
    ].filter(isString);
    const missingKeys = requiredKeys.filter((key) => !(key in node.props));
    if (missingKeys.length > 0) {
      const stringToHelpIdentify = node.props.name || node.props.path ? `for "${node.props.name || node.props.path}" ` : "";
      throw new Error(
        `Route element ${stringToHelpIdentify}is missing required props: ` + missingKeys.join(", ")
      );
    }
  }
  return isValidRouteElement;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isNotFoundRoute,
  isRedirectRoute,
  isStandardRoute,
  isValidRoute
});
