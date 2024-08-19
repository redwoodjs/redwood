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
var router_exports = {};
__export(router_exports, {
  Router: () => Router
});
module.exports = __toCommonJS(router_exports);
var import_react = __toESM(require("react"), 1);
var import_active_route_loader = require("./active-route-loader.js");
var import_analyzeRoutes = require("./analyzeRoutes.js");
var import_AuthenticatedRoute = require("./AuthenticatedRoute.js");
var import_location = require("./location.js");
var import_namedRoutes = require("./namedRoutes.js");
var import_page = require("./page.js");
var import_PageLoadingContext = require("./PageLoadingContext.js");
var import_params = require("./params.js");
var import_redirect = require("./redirect.js");
var import_router_context = require("./router-context.js");
var import_splash_page = require("./splash-page.js");
var import_util = require("./util.js");
const Router = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  trailingSlashes = "never",
  children
}) => {
  return (
    // Level 1/3 (outer-most)
    // Wrap it in the provider so that useLocation can be used
    /* @__PURE__ */ import_react.default.createElement(import_location.LocationProvider, { trailingSlashes }, /* @__PURE__ */ import_react.default.createElement(
      LocationAwareRouter,
      {
        useAuth,
        paramTypes,
        pageLoadingDelay
      },
      children
    ))
  );
};
const LocationAwareRouter = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  children
}) => {
  const location = (0, import_location.useLocation)();
  const analyzeRoutesResult = (0, import_react.useMemo)(() => {
    return (0, import_analyzeRoutes.analyzeRoutes)(children, {
      currentPathName: location.pathname,
      // @TODO We haven't handled this with SSR/Streaming yet.
      // May need a babel plugin to extract userParamTypes from Routes.tsx
      userParamTypes: paramTypes
    });
  }, [location.pathname, children, paramTypes]);
  const {
    pathRouteMap,
    hasRootRoute,
    namedRoutesMap,
    NotFoundPage,
    activeRoutePath
  } = analyzeRoutesResult;
  const hasGeneratedRoutes = hasCustomRoutes(namedRoutesMap);
  const splashPageExists = typeof import_splash_page.SplashPage !== "undefined";
  const isOnNonExistentRootRoute = !hasRootRoute && location.pathname === "/";
  if (!hasRootRoute && splashPageExists) {
    namedRoutesMap["home"] = () => "/";
  }
  Object.assign(import_namedRoutes.namedRoutes, namedRoutesMap);
  const shouldShowSplash = (isOnNonExistentRootRoute || !hasGeneratedRoutes) && splashPageExists;
  if (shouldShowSplash) {
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
        import_router_context.RouterContextProvider,
        {
          useAuth,
          paramTypes,
          routes: analyzeRoutesResult
        },
        /* @__PURE__ */ import_react.default.createElement(import_params.ParamsProvider, null, /* @__PURE__ */ import_react.default.createElement(import_PageLoadingContext.PageLoadingContextProvider, { delay: pageLoadingDelay }, /* @__PURE__ */ import_react.default.createElement(
          import_active_route_loader.ActiveRouteLoader,
          {
            spec: (0, import_page.normalizePage)(NotFoundPage),
            path: location.pathname
          }
        )))
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
  return /* @__PURE__ */ import_react.default.createElement(
    import_router_context.RouterContextProvider,
    {
      useAuth,
      paramTypes,
      routes: analyzeRoutesResult,
      activeRouteName: name
    },
    /* @__PURE__ */ import_react.default.createElement(import_params.ParamsProvider, { allParams }, /* @__PURE__ */ import_react.default.createElement(import_PageLoadingContext.PageLoadingContextProvider, { delay: pageLoadingDelay }, redirectPath && /* @__PURE__ */ import_react.default.createElement(import_redirect.Redirect, { to: redirectPath }), !redirectPath && page && /* @__PURE__ */ import_react.default.createElement(WrappedPage, { sets }, /* @__PURE__ */ import_react.default.createElement(
      import_active_route_loader.ActiveRouteLoader,
      {
        path,
        spec: (0, import_page.normalizePage)(page),
        params: allParams,
        whileLoadingPage
      }
    ))))
  );
};
const WrappedPage = (0, import_react.memo)(({ sets, children }) => {
  if (!sets || sets.length === 0) {
    return children;
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
      wrapped = /* @__PURE__ */ import_react.default.createElement(import_AuthenticatedRoute.AuthenticatedRoute, { ...set.props, unauthenticated }, wrapped);
    }
    return wrapped;
  }, children);
});
function hasCustomRoutes(obj) {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return true;
    }
  }
  return false;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Router
});
