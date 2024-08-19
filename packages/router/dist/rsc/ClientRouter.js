import React, { useMemo } from "react";
import { analyzeRoutes } from "../analyzeRoutes.js";
import { AuthenticatedRoute } from "../AuthenticatedRoute.js";
import { LocationProvider, useLocation } from "../location.js";
import { namedRoutes } from "../namedRoutes.js";
import { RouterContextProvider } from "../router-context.js";
import { rscFetch } from "./rscFetchForClientRouter.js";
const Router = ({ useAuth, paramTypes, children }) => {
  return (
    // Wrap it in the provider so that useLocation can be used
    /* @__PURE__ */ React.createElement(LocationProvider, null, /* @__PURE__ */ React.createElement(LocationAwareRouter, { paramTypes, useAuth }, children))
  );
};
const LocationAwareRouter = ({
  useAuth,
  paramTypes,
  children
}) => {
  const { pathname, search } = useLocation();
  const analyzeRoutesResult = useMemo(() => {
    return analyzeRoutes(children, {
      currentPathName: pathname,
      userParamTypes: paramTypes
    });
  }, [pathname, children, paramTypes]);
  const { namedRoutesMap, pathRouteMap, activeRoutePath } = analyzeRoutesResult;
  Object.assign(namedRoutes, namedRoutesMap);
  if (!activeRoutePath) {
    return rscFetch("__rwjs__Routes", {
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
    return /* @__PURE__ */ React.createElement(
      RouterContextProvider,
      {
        useAuth,
        paramTypes,
        routes: analyzeRoutesResult,
        activeRouteName: requestedRoute.name
      },
      /* @__PURE__ */ React.createElement(AuthenticatedRoute, { unauthenticated }, rscFetch("__rwjs__Routes", { location: { pathname, search } }))
    );
  }
  return rscFetch("__rwjs__Routes", {
    location: { pathname, search }
  });
};
export {
  Router
};
