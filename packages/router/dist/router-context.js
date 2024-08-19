import React, { createContext, useContext, useMemo } from "react";
import { useNoAuth } from "@redwoodjs/auth";
const RouterStateContext = createContext(void 0);
const RouterContextProvider = ({
  useAuth,
  paramTypes,
  routes,
  activeRouteName,
  children
}) => {
  const state = useMemo(
    () => ({
      useAuth: useAuth || useNoAuth,
      paramTypes,
      routes,
      activeRouteName
    }),
    [useAuth, paramTypes, routes, activeRouteName]
  );
  return /* @__PURE__ */ React.createElement(RouterStateContext.Provider, { value: state }, children);
};
const useRouterState = () => {
  const context = useContext(RouterStateContext);
  if (context === void 0) {
    throw new Error(
      "useRouterState must be used within a RouterContextProvider"
    );
  }
  return context;
};
export {
  RouterContextProvider,
  useRouterState
};
