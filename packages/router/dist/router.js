import React, { useMemo, memo } from "react";
import { ActiveRouteLoader } from "./active-route-loader.js";
import { analyzeRoutes } from "./analyzeRoutes.js";
import { AuthenticatedRoute } from "./AuthenticatedRoute.js";
import { LocationProvider, useLocation } from "./location.js";
import { namedRoutes } from "./namedRoutes.js";
import { normalizePage } from "./page.js";
import { PageLoadingContextProvider } from "./PageLoadingContext.js";
import { ParamsProvider } from "./params.js";
import { Redirect } from "./redirect.js";
import { RouterContextProvider } from "./router-context.js";
import { SplashPage } from "./splash-page.js";
import { matchPath, parseSearch, replaceParams, validatePath } from "./util.js";
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
    /* @__PURE__ */ React.createElement(LocationProvider, { trailingSlashes }, /* @__PURE__ */ React.createElement(
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
  const location = useLocation();
  const analyzeRoutesResult = useMemo(() => {
    return analyzeRoutes(children, {
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
  const splashPageExists = typeof SplashPage !== "undefined";
  const isOnNonExistentRootRoute = !hasRootRoute && location.pathname === "/";
  if (!hasRootRoute && splashPageExists) {
    namedRoutesMap["home"] = () => "/";
  }
  Object.assign(namedRoutes, namedRoutesMap);
  const shouldShowSplash = (isOnNonExistentRootRoute || !hasGeneratedRoutes) && splashPageExists;
  if (shouldShowSplash) {
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
        RouterContextProvider,
        {
          useAuth,
          paramTypes,
          routes: analyzeRoutesResult
        },
        /* @__PURE__ */ React.createElement(ParamsProvider, null, /* @__PURE__ */ React.createElement(PageLoadingContextProvider, { delay: pageLoadingDelay }, /* @__PURE__ */ React.createElement(
          ActiveRouteLoader,
          {
            spec: normalizePage(NotFoundPage),
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
  return /* @__PURE__ */ React.createElement(
    RouterContextProvider,
    {
      useAuth,
      paramTypes,
      routes: analyzeRoutesResult,
      activeRouteName: name
    },
    /* @__PURE__ */ React.createElement(ParamsProvider, { allParams }, /* @__PURE__ */ React.createElement(PageLoadingContextProvider, { delay: pageLoadingDelay }, redirectPath && /* @__PURE__ */ React.createElement(Redirect, { to: redirectPath }), !redirectPath && page && /* @__PURE__ */ React.createElement(WrappedPage, { sets }, /* @__PURE__ */ React.createElement(
      ActiveRouteLoader,
      {
        path,
        spec: normalizePage(page),
        params: allParams,
        whileLoadingPage
      }
    ))))
  );
};
const WrappedPage = memo(({ sets, children }) => {
  if (!sets || sets.length === 0) {
    return children;
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
export {
  Router
};
