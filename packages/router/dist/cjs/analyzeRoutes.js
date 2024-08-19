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
var analyzeRoutes_exports = {};
__export(analyzeRoutes_exports, {
  analyzeRoutes: () => analyzeRoutes
});
module.exports = __toCommonJS(analyzeRoutes_exports);
var import_react = require("react");
var import_route_validators = require("./route-validators.js");
var import_Set = require("./Set.js");
var import_util = require("./util.js");
function analyzeRoutes(children, { currentPathName, userParamTypes }) {
  const pathRouteMap = {};
  const namedRoutesMap = {};
  let hasRootRoute = false;
  let NotFoundPage;
  let activeRoutePath;
  const recurseThroughRouter = ({
    nodes,
    whileLoadingPageFromSet,
    sets: previousSets = []
  }) => {
    let nextSetId = 0;
    nodes.forEach((node) => {
      if ((0, import_route_validators.isValidRoute)(node)) {
        const route = node;
        if ((0, import_route_validators.isNotFoundRoute)(route)) {
          NotFoundPage = route.props.page;
          return;
        }
        if (route.props.path === "/") {
          hasRootRoute = true;
        }
        if ((0, import_route_validators.isRedirectRoute)(route)) {
          const { name, redirect, path } = route.props;
          (0, import_util.validatePath)(path, name || path);
          const { match } = (0, import_util.matchPath)(path, currentPathName, {
            userParamTypes
          });
          if (match && !activeRoutePath) {
            activeRoutePath = path;
          }
          pathRouteMap[path] = {
            redirect,
            name: name || null,
            path,
            page: null,
            // Redirects don't need pages. We set this to null for consistency
            sets: previousSets
          };
          if (name) {
            namedRoutesMap[name] = (args = {}) => (0, import_util.replaceParams)(path, args);
          }
        }
        if ((0, import_route_validators.isStandardRoute)(route)) {
          const { name, path, page } = route.props;
          (0, import_util.validatePath)(path, name);
          const { match } = (0, import_util.matchPath)(path, currentPathName, {
            userParamTypes
          });
          if (match && !activeRoutePath) {
            activeRoutePath = path;
          }
          pathRouteMap[path] = {
            redirect: null,
            name,
            path,
            whileLoadingPage: route.props.whileLoadingPage || whileLoadingPageFromSet,
            page,
            sets: previousSets
          };
          namedRoutesMap[name] = (args = {}) => (0, import_util.replaceParams)(path, args);
        }
      }
      if ((0, import_Set.isSetNode)(node)) {
        const {
          children: children2,
          whileLoadingPage: whileLoadingPageFromCurrentSet,
          wrap: wrapFromCurrentSet,
          ...otherPropsFromCurrentSet
        } = node.props;
        let wrapperComponentsArray = [];
        if (wrapFromCurrentSet) {
          wrapperComponentsArray = Array.isArray(wrapFromCurrentSet) ? wrapFromCurrentSet : [wrapFromCurrentSet];
        }
        nextSetId = nextSetId + 1;
        recurseThroughRouter({
          nodes: import_react.Children.toArray(children2),
          // When there's a whileLoadingPage prop on a Set, we pass it down to all its children
          // If the parent node was also a Set with whileLoadingPage, we pass it down. The child's whileLoadingPage
          // will always take precedence over the parent's
          whileLoadingPageFromSet: whileLoadingPageFromCurrentSet || whileLoadingPageFromSet,
          sets: [
            ...previousSets,
            {
              id: createSetId(nextSetId, previousSets),
              wrappers: wrapperComponentsArray,
              isPrivate: (0, import_Set.isPrivateSetNode)(node) || // The following two conditions can be removed when we remove
              // the deprecated private prop
              (0, import_Set.isPrivateNode)(node) || !!otherPropsFromCurrentSet.private,
              props: otherPropsFromCurrentSet
            }
          ]
        });
      }
    });
  };
  recurseThroughRouter({ nodes: import_react.Children.toArray(children) });
  return {
    pathRouteMap,
    namedRoutesMap,
    hasRootRoute,
    NotFoundPage,
    activeRoutePath
  };
}
function createSetId(nextSetId, previousSets) {
  const firstLevel = previousSets.length === 0;
  if (firstLevel) {
    return nextSetId.toString();
  }
  return previousSets.at(-1)?.id + "." + nextSetId;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  analyzeRoutes
});
