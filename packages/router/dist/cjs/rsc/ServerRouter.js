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
var ServerRouter_exports = {};
__export(ServerRouter_exports, {
  Router: () => Router
});
module.exports = __toCommonJS(ServerRouter_exports);
var import_react = __toESM(require("react"), 1);
var import_server_store = require("@redwoodjs/server-store");
var import_analyzeRoutes = require("../analyzeRoutes.js");
var import_namedRoutes = require("../namedRoutes.js");
var import_page = require("../page.js");
var import_splash_page = require("../splash-page.js");
var import_util = require("../util.js");
var import_ServerRouteLoader = require("./ServerRouteLoader.js");
const Router = ({ paramTypes, children }) => {
  const location = (0, import_server_store.getLocation)();
  const analyzedRoutes = (0, import_analyzeRoutes.analyzeRoutes)(children, {
    currentPathName: location.pathname,
    // @TODO We haven't handled this with SSR/Streaming yet.
    // May need a babel plugin to extract userParamTypes from Routes.tsx
    userParamTypes: paramTypes
  });
  const {
    pathRouteMap,
    hasRootRoute,
    namedRoutesMap,
    NotFoundPage,
    activeRoutePath
  } = analyzedRoutes;
  Object.assign(import_namedRoutes.namedRoutes, namedRoutesMap);
  const hasGeneratedRoutes = Object.keys(import_namedRoutes.namedRoutes).length > 0;
  const shouldShowSplash = !hasRootRoute && location.pathname === "/" || !hasGeneratedRoutes;
  if (shouldShowSplash && typeof import_splash_page.SplashPage !== "undefined") {
    return /* @__PURE__ */ import_react.default.createElement(
      import_splash_page.SplashPage,
      {
        hasGeneratedRoutes,
        allStandardRoutes: pathRouteMap
      }
    );
  }
  if (!activeRoutePath) {
    if (NotFoundPage) {
      return /* @__PURE__ */ import_react.default.createElement(
        import_ServerRouteLoader.ServerRouteLoader,
        {
          spec: (0, import_page.normalizePage)(NotFoundPage),
          path: location.pathname
        }
      );
    }
    return null;
  }
  const { path, page, name, redirect, whileLoadingPage, sets } = pathRouteMap[activeRoutePath];
  if (!path) {
    throw new Error(`Route "${name}" needs to specify a path`);
  }
  (0, import_util.validatePath)(path, name || path);
  const { params: pathParams } = (0, import_util.matchPath)(path, location.pathname, {
    userParamTypes: paramTypes
  });
  const searchParams = (0, import_util.parseSearch)(location.search);
  const allParams = { ...searchParams, ...pathParams };
  let redirectPath = void 0;
  if (redirect) {
    if (redirect.startsWith("/")) {
      redirectPath = (0, import_util.replaceParams)(redirect, allParams);
    } else {
      const redirectRouteObject = Object.values(pathRouteMap).find(
        (route) => route.name === redirect
      );
      if (!redirectRouteObject) {
        throw new Error(
          `Redirect target route "${redirect}" does not exist for route "${name}"`
        );
      }
      redirectPath = (0, import_util.replaceParams)(redirectRouteObject.path, allParams);
    }
  }
  return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, !redirectPath && page && /* @__PURE__ */ import_react.default.createElement(
    WrappedPage,
    {
      sets,
      routeLoaderElement: /* @__PURE__ */ import_react.default.createElement(
        import_ServerRouteLoader.ServerRouteLoader,
        {
          path,
          spec: (0, import_page.normalizePage)(page),
          params: allParams,
          whileLoadingPage
        }
      )
    }
  ));
};
function hasRole(requiredRoles) {
  const { roles } = (0, import_server_store.getAuthState)();
  const requiredRolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return requiredRolesArray.some((role) => roles.includes(role));
}
const AuthenticatedRoute = ({
  children,
  roles
}) => {
  const { isAuthenticated } = (0, import_server_store.getAuthState)();
  const isAuthorized = isAuthenticated && (!roles || hasRole(roles));
  if (isAuthorized) {
    return /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, children);
  }
  if (!isAuthenticated) {
    throw new Error("401 Unauthorized");
  }
  throw new Error("403 Forbidden");
};
const WrappedPage = ({ routeLoaderElement, sets }) => {
  if (!sets || sets.length === 0) {
    return routeLoaderElement;
  }
  return sets.reduceRight((acc, set) => {
    let wrapped = set.wrappers.reduceRight((acc2, Wrapper, index) => {
      return import_react.default.createElement(
        Wrapper,
        { ...set.props, key: set.id + "-" + index },
        acc2
      );
    }, acc);
    if (set.isPrivate) {
      const unauthenticated = set.props.unauthenticated;
      if (!unauthenticated || typeof unauthenticated !== "string") {
        throw new Error(
          "You must specify an `unauthenticated` route when using PrivateSet"
        );
      }
      wrapped = /* @__PURE__ */ import_react.default.createElement(AuthenticatedRoute, { ...set.props, unauthenticated }, wrapped);
    }
    return wrapped;
  }, routeLoaderElement);
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Router
});
