import { Children } from "react";
import {
  isNotFoundRoute,
  isRedirectRoute,
  isStandardRoute,
  isValidRoute
} from "./route-validators.js";
import { isPrivateNode, isPrivateSetNode, isSetNode } from "./Set.js";
import {
  matchPath,
  replaceParams,
  validatePath
} from "./util.js";
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
      if (isValidRoute(node)) {
        const route = node;
        if (isNotFoundRoute(route)) {
          NotFoundPage = route.props.page;
          return;
        }
        if (route.props.path === "/") {
          hasRootRoute = true;
        }
        if (isRedirectRoute(route)) {
          const { name, redirect, path } = route.props;
          validatePath(path, name || path);
          const { match } = matchPath(path, currentPathName, {
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
            namedRoutesMap[name] = (args = {}) => replaceParams(path, args);
          }
        }
        if (isStandardRoute(route)) {
          const { name, path, page } = route.props;
          validatePath(path, name);
          const { match } = matchPath(path, currentPathName, {
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
          namedRoutesMap[name] = (args = {}) => replaceParams(path, args);
        }
      }
      if (isSetNode(node)) {
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
          nodes: Children.toArray(children2),
          // When there's a whileLoadingPage prop on a Set, we pass it down to all its children
          // If the parent node was also a Set with whileLoadingPage, we pass it down. The child's whileLoadingPage
          // will always take precedence over the parent's
          whileLoadingPageFromSet: whileLoadingPageFromCurrentSet || whileLoadingPageFromSet,
          sets: [
            ...previousSets,
            {
              id: createSetId(nextSetId, previousSets),
              wrappers: wrapperComponentsArray,
              isPrivate: isPrivateSetNode(node) || // The following two conditions can be removed when we remove
              // the deprecated private prop
              isPrivateNode(node) || !!otherPropsFromCurrentSet.private,
              props: otherPropsFromCurrentSet
            }
          ]
        });
      }
    });
  };
  recurseThroughRouter({ nodes: Children.toArray(children) });
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
export {
  analyzeRoutes
};
