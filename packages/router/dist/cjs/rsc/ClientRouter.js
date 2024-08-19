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
var ClientRouter_exports = {};
__export(ClientRouter_exports, {
  Router: () => Router
});
module.exports = __toCommonJS(ClientRouter_exports);
var import_react = __toESM(require("react"), 1);
var import_analyzeRoutes = require("../analyzeRoutes.js");
var import_AuthenticatedRoute = require("../AuthenticatedRoute.js");
var import_location = require("../location.js");
var import_namedRoutes = require("../namedRoutes.js");
var import_router_context = require("../router-context.js");
var import_rscFetchForClientRouter = require("./rscFetchForClientRouter.js");
const Router = ({ useAuth, paramTypes, children }) => {
  return (
    // Wrap it in the provider so that useLocation can be used
    /* @__PURE__ */ import_react.default.createElement(import_location.LocationProvider, null, /* @__PURE__ */ import_react.default.createElement(LocationAwareRouter, { paramTypes, useAuth }, children))
  );
};
const LocationAwareRouter = ({
  useAuth,
  paramTypes,
  children
}) => {
  const { pathname, search } = (0, import_location.useLocation)();
  const analyzeRoutesResult = (0, import_react.useMemo)(() => {
    return (0, import_analyzeRoutes.analyzeRoutes)(children, {
      currentPathName: pathname,
      userParamTypes: paramTypes
    });
  }, [pathname, children, paramTypes]);
  const { namedRoutesMap, pathRouteMap, activeRoutePath } = analyzeRoutesResult;
  Object.assign(import_namedRoutes.namedRoutes, namedRoutesMap);
  if (!activeRoutePath) {
    return (0, import_rscFetchForClientRouter.rscFetch)("__rwjs__Routes", {
      location: { pathname, search }
    });
  }
  const requestedRoute = pathRouteMap[activeRoutePath];
  const reversedSets = requestedRoute.sets.toReversed();
  const privateSet = reversedSets.find((set) => set.isPrivate);
  if (privateSet) {
    const unauthenticated = privateSet.props.unauthenticated;
    if (!unauthenticated || typeof unauthenticated !== "string") {
      throw new Error(
        "You must specify an `unauthenticated` route when using PrivateSet"
      );
    }
    return /* @__PURE__ */ import_react.default.createElement(
      import_router_context.RouterContextProvider,
      {
        useAuth,
        paramTypes,
        routes: analyzeRoutesResult,
        activeRouteName: requestedRoute.name
      },
      /* @__PURE__ */ import_react.default.createElement(import_AuthenticatedRoute.AuthenticatedRoute, { unauthenticated }, (0, import_rscFetchForClientRouter.rscFetch)("__rwjs__Routes", { location: { pathname, search } }))
    );
  }
  return (0, import_rscFetchForClientRouter.rscFetch)("__rwjs__Routes", {
    location: { pathname, search }
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Router
});
