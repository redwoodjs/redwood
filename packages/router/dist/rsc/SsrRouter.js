import React, { useMemo } from "react";
import { analyzeRoutes } from "../analyzeRoutes.js";
import { LocationProvider, useLocation } from "../location.js";
import { namedRoutes } from "../namedRoutes.js";
import { renderRoutesFromDist } from "./clientSsr.js";
const Router = ({ paramTypes, children }) => {
  return /* @__PURE__ */ React.createElement(LocationProvider, null, /* @__PURE__ */ React.createElement(LocationAwareRouter, { paramTypes }, children));
};
const LocationAwareRouter = ({ paramTypes, children }) => {
  const { pathname } = useLocation();
  const { namedRoutesMap } = useMemo(() => {
    return analyzeRoutes(children, {
      currentPathName: pathname,
      userParamTypes: paramTypes
    });
  }, [pathname, children, paramTypes]);
  Object.assign(namedRoutes, namedRoutesMap);
  return renderRoutesFromDist(pathname);
};
export {
  Router
};
