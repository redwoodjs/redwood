import React from "react";
import { getAuthState, getLocation } from "@redwoodjs/server-store";
import { analyzeRoutes } from "../analyzeRoutes.js";
import { namedRoutes } from "../namedRoutes.js";
import { normalizePage } from "../page.js";
import { SplashPage } from "../splash-page.js";
import { matchPath, parseSearch, replaceParams, validatePath } from "../util.js";
import { ServerRouteLoader } from "./ServerRouteLoader.js";
const Router = ({ paramTypes, children }) => {
  const location = getLocation();
  const analyzedRoutes = analyzeRoutes(children, {
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
  Object.assign(namedRoutes, namedRoutesMap);
  const hasGeneratedRoutes = Object.keys(namedRoutes).length > 0;
  const shouldShowSplash = !hasRootRoute && location.pathname === "/" || !hasGeneratedRoutes;
  if (shouldShowSplash && typeof SplashPage !== "undefined") {
    return /* @__PURE__ */ React.createElement(
      SplashPage,
      {
        hasGeneratedRoutes,
        allStandardRoutes: pathRouteMap
      }
    );
  }
  if (!activeRoutePath) {
    if (NotFoundPage) {
      return /* @__PURE__ */ React.createElement(
        ServerRouteLoader,
        {
          spec: normalizePage(NotFoundPage),
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
  validatePath(path, name || path);
  const { params: pathParams } = matchPath(path, location.pathname, {
    userParamTypes: paramTypes
  });
  const searchParams = parseSearch(location.search);
  const allParams = { ...searchParams, ...pathParams };
  let redirectPath = void 0;
  if (redirect) {
    if (redirect.startsWith("/")) {
      redirectPath = replaceParams(redirect, allParams);
    } else {
      const redirectRouteObject = Object.values(pathRouteMap).find(
        (route) => route.name === redirect
      );
      if (!redirectRouteObject) {
        throw new Error(
          `Redirect target route "${redirect}" does not exist for route "${name}"`
        );
      }
      redirectPath = replaceParams(redirectRouteObject.path, allParams);
    }
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, !redirectPath && page && /* @__PURE__ */ React.createElement(
    WrappedPage,
    {
      sets,
      routeLoaderElement: /* @__PURE__ */ React.createElement(
        ServerRouteLoader,
        {
          path,
          spec: normalizePage(page),
          params: allParams,
          whileLoadingPage
        }
      )
    }
  ));
};
function hasRole(requiredRoles) {
  const { roles } = getAuthState();
  const requiredRolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  return requiredRolesArray.some((role) => roles.includes(role));
}
const AuthenticatedRoute = ({
  children,
  roles
}) => {
  const { isAuthenticated } = getAuthState();
  const isAuthorized = isAuthenticated && (!roles || hasRole(roles));
  if (isAuthorized) {
    return /* @__PURE__ */ React.createElement(React.Fragment, null, children);
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
      return React.createElement(
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
      wrapped = /* @__PURE__ */ React.createElement(AuthenticatedRoute, { ...set.props, unauthenticated }, wrapped);
    }
    return wrapped;
  }, routeLoaderElement);
};
export {
  Router
};
