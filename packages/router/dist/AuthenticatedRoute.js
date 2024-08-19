import React, { useCallback } from "react";
import { namedRoutes } from "./namedRoutes.js";
import { Redirect } from "./redirect.js";
import { useRouterState } from "./router-context.js";
const AuthenticatedRoute = ({
  unauthenticated,
  roles,
  whileLoadingAuth,
  children
}) => {
  const routerState = useRouterState();
  const {
    loading: authLoading,
    isAuthenticated,
    hasRole
  } = routerState.useAuth();
  const unauthorized = useCallback(() => {
    return !(isAuthenticated && (!roles || hasRole(roles)));
  }, [isAuthenticated, roles, hasRole]);
  if (unauthorized()) {
    if (authLoading) {
      return whileLoadingAuth?.() || null;
    } else {
      const currentLocation = globalThis.location.pathname + encodeURIComponent(globalThis.location.search);
      const generatedRoutesMap = namedRoutes;
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
      return /* @__PURE__ */ React.createElement(Redirect, { to: `${unauthenticatedPath}?redirectTo=${currentLocation}` });
    }
  }
  return /* @__PURE__ */ React.createElement(React.Fragment, null, children);
};
export {
  AuthenticatedRoute
};
