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
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  Link: () => import_link.Link,
  LocationProvider: () => import_location.LocationProvider,
  NavLink: () => import_navLink.NavLink,
  PageLoadingContextProvider: () => import_PageLoadingContext.PageLoadingContextProvider,
  ParamsContext: () => import_params.ParamsContext,
  ParamsProvider: () => import_params.ParamsProvider,
  Redirect: () => import_redirect.Redirect,
  Route: () => import_Route.Route,
  RouteAnnouncement: () => import_route_announcement.default,
  RouteFocus: () => import_route_focus.default,
  Router: () => import_router.Router,
  SkipNavContent: () => import_skipNav.SkipNavContent,
  SkipNavLink: () => import_skipNav.SkipNavLink,
  back: () => import_history.back,
  getRouteRegexAndParams: () => import_util.getRouteRegexAndParams,
  matchPath: () => import_util.matchPath,
  navigate: () => import_history.navigate,
  parseSearch: () => import_util.parseSearch,
  routes: () => import_namedRoutes.namedRoutes,
  useLocation: () => import_location.useLocation,
  usePageLoadingContext: () => import_PageLoadingContext.usePageLoadingContext,
  useParams: () => import_params.useParams
});
module.exports = __toCommonJS(src_exports);
var import_history = require("./history.js");
var import_navLink = require("./navLink.js");
var import_link = require("./link.js");
var import_location = require("./location.js");
var import_redirect = require("./redirect.js");
var import_PageLoadingContext = require("./PageLoadingContext.js");
var import_params = require("./params.js");
var import_router = require("./router.js");
var import_Route = require("./Route.js");
var import_namedRoutes = require("./namedRoutes.js");
__reExport(src_exports, require("./Set.js"), module.exports);
var import_route_announcement = __toESM(require("./route-announcement.js"), 1);
__reExport(src_exports, require("./route-announcement.js"), module.exports);
var import_route_focus = __toESM(require("./route-focus.js"), 1);
__reExport(src_exports, require("./route-focus.js"), module.exports);
__reExport(src_exports, require("./useRouteName.js"), module.exports);
__reExport(src_exports, require("./useRoutePaths.js"), module.exports);
__reExport(src_exports, require("./useMatch.js"), module.exports);
__reExport(src_exports, require("./useBlocker.js"), module.exports);
var import_util = require("./util.js");
var import_skipNav = require("./skipNav.js");
__reExport(src_exports, require("./routeParamsTypes.js"), module.exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Link,
  LocationProvider,
  NavLink,
  PageLoadingContextProvider,
  ParamsContext,
  ParamsProvider,
  Redirect,
  Route,
  RouteAnnouncement,
  RouteFocus,
  Router,
  SkipNavContent,
  SkipNavLink,
  back,
  getRouteRegexAndParams,
  matchPath,
  navigate,
  parseSearch,
  routes,
  useLocation,
  usePageLoadingContext,
  useParams,
  ...require("./Set.js"),
  ...require("./route-announcement.js"),
  ...require("./route-focus.js"),
  ...require("./useRouteName.js"),
  ...require("./useRoutePaths.js"),
  ...require("./useMatch.js"),
  ...require("./useBlocker.js"),
  ...require("./routeParamsTypes.js")
});
