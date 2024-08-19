"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var useRoutePaths_exports = {};
__export(useRoutePaths_exports, {
  useRoutePath: () => useRoutePath,
  useRoutePaths: () => useRoutePaths
});
module.exports = __toCommonJS(useRoutePaths_exports);
var import_router_context = require("./router-context.js");
var import_useRouteName = require("./useRouteName.js");
function useRoutePaths() {
  const routerState = (0, import_router_context.useRouterState)();
  const routePaths = Object.values(routerState.routes.pathRouteMap).reduce((routePathsAcc, currRoute) => {
    if (currRoute.name) {
      routePathsAcc[currRoute.name] = currRoute.path;
    }
    return routePathsAcc;
  }, {});
  return routePaths;
}
function useRoutePath(routeName) {
  const currentRouteName = (0, import_useRouteName.useRouteName)();
  const routePaths = useRoutePaths();
  const name = routeName || currentRouteName;
  if (!name) {
    return void 0;
  }
  return routePaths[name];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  useRoutePath,
  useRoutePaths
});
