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
var routes_exports = {};
__export(routes_exports, {
  getDuplicateRoutes: () => getDuplicateRoutes,
  getProjectRoutes: () => getProjectRoutes,
  warningForDuplicateRoutes: () => warningForDuplicateRoutes
});
module.exports = __toCommonJS(routes_exports);
var import_path = __toESM(require("path"));
var import_chalk = __toESM(require("chalk"));
var import_project_config = require("@redwoodjs/project-config");
var import_router = require("@redwoodjs/router");
var import_dist = require("@redwoodjs/structure/dist/index.js");
function getDuplicateRoutes() {
  const duplicateRoutes = [];
  const allRoutes = (0, import_dist.getProject)((0, import_project_config.getPaths)().base).router.routes;
  const uniqueNames = new Set(
    allRoutes.filter((route) => route.name !== void 0).map((route) => route.name)
  );
  uniqueNames.forEach((name) => {
    const routesWithName = allRoutes.filter((route) => {
      return route.name === name;
    });
    if (routesWithName.length > 1) {
      duplicateRoutes.push(
        ...routesWithName.map((route) => {
          return {
            name: route.name,
            page: route.page_identifier_str,
            path: route.path
          };
        })
      );
    }
  });
  return duplicateRoutes;
}
function warningForDuplicateRoutes() {
  const duplicatedRoutes = getDuplicateRoutes();
  let message = "";
  if (duplicatedRoutes.length > 0) {
    message += import_chalk.default.keyword("orange")(
      `Warning: ${duplicatedRoutes.length} duplicate routes have been detected, only the route(s) closest to the top of the file will be used.
`
    );
    duplicatedRoutes.forEach((route) => {
      message += ` ${import_chalk.default.keyword("orange")("->")} Name: "${route.name}", Path: "${route.path}", Page: "${route.page}"
`;
    });
  }
  return message.trimEnd();
}
const getProjectRoutes = () => {
  const rwProject = (0, import_dist.getProject)((0, import_project_config.getPaths)().base);
  const routes = rwProject.getRouter().routes;
  return routes.map((route) => {
    const { matchRegexString, routeParams } = route.isNotFound ? { matchRegexString: null, routeParams: null } : (0, import_router.getRouteRegexAndParams)(route.path);
    return {
      name: route.isNotFound ? "NotFoundPage" : route.name,
      pathDefinition: route.isNotFound ? "notfound" : route.path,
      hasParams: route.hasParameters,
      id: route.id,
      isNotFound: route.isNotFound,
      filePath: route.page?.filePath,
      relativeFilePath: route.page?.filePath ? import_path.default.relative((0, import_project_config.getPaths)().web.src, route.page?.filePath) : void 0,
      routeHooks: (0, import_project_config.getRouteHookForPage)(route.page?.filePath),
      renderMode: route.renderMode,
      matchRegexString,
      paramNames: routeParams,
      // TODO (STREAMING) deal with permanent/temp later
      redirect: route.redirect ? { to: route.redirect, permanent: false } : null,
      isPrivate: route.isPrivate,
      unauthenticated: route.unauthenticated,
      roles: route.roles,
      pageIdentifier: route.page_identifier_str
    };
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getDuplicateRoutes,
  getProjectRoutes,
  warningForDuplicateRoutes
});
