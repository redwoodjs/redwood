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
var AuthenticatedRoute_exports = {};
__export(AuthenticatedRoute_exports, {
  AuthenticatedRoute: () => AuthenticatedRoute
});
module.exports = __toCommonJS(AuthenticatedRoute_exports);
var import_react = __toESM(require("react"), 1);
var import_namedRoutes = require("./namedRoutes.js");
var import_redirect = require("./redirect.js");
var import_router_context = require("./router-context.js");
const AuthenticatedRoute = ({
  unauthenticated,
  roles,
  whileLoadingAuth,
  children
}) => {
  const routerState = (0, import_router_context.useRouterState)();
  const {
    loading: authLoading,
    isAuthenticated,
    hasRole
  } = routerState.useAuth();
  const unauthorized = (0, import_react.useCallback)(() => {
    return !(isAuthenticated && (!roles || hasRole(roles)));
  }, [isAuthenticated, roles, hasRole]);
  if (unauthorized()) {
    if (authLoading) {
      return whileLoadingAuth?.() || null;
    } else {
      const currentLocation = globalThis.location.pathname + encodeURIComponent(globalThis.location.search);
      const generatedRoutesMap = import_namedRoutes.namedRoutes;
      if (!generatedRoutesMap[unauthenticated]) {
        throw new Error(`We could not find a route named ${unauthenticated}`);
      }
      let unauthenticatedPath;
      try {
        unauthenticatedPath = generatedRoutesMap[unauthenticated]();
      } catch (e) {
        if (e instanceof Error && /Missing parameter .* for route/.test(e.message)) {
          throw new Error(
            `Redirecting to route "${unauthenticated}" would require route parameters, which currently is not supported. Please choose a different route`
          );
        }
        throw new Error(
          `Could not redirect to the route named ${unauthenticated}`
        );
      }
      return /* @__PURE__ */ import_react.default.createElement(import_redirect.Redirect, { to: `${unauthenticatedPath}?redirectTo=${currentLocation}` });
    }
  }
  return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, children);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthenticatedRoute
});
