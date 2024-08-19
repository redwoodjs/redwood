import { isValidElement } from "react";
import { Route } from "./Route.js";
function isNodeTypeRoute(node) {
  return isValidElement(node) && node.type === Route;
}
function isString(value) {
  return typeof value === "string";
}
function isStandardRoute(node) {
  return !node.props.notfound && !node.props.redirect;
}
function isRedirectRoute(node) {
  return !!node.props.redirect;
}
function isNotFoundRoute(node) {
  return !!node.props.notfound;
}
function isValidRoute(node) {
  const isValidRouteElement = isNodeTypeRoute(node);
  if (isValidRouteElement) {
    const notFoundOrRedirect = node.props.notfound || node.props.redirect;
    const requiredKeys = [
      !node.props.notfound && "path",
      // redirects don't need an actual page, but notfound and standard do
      !node.props.redirect && "page",
      // Redirects can have names, but aren't required to
      !notFoundOrRedirect && "name"
    ].filter(isString);
    const missingKeys = requiredKeys.filter((key) => !(key in node.props));
    if (missingKeys.length > 0) {
      const stringToHelpIdentify = node.props.name || node.props.path ? `for "${node.props.name || node.props.path}" ` : "";
      throw new Error(
        `Route element ${stringToHelpIdentify}is missing required props: ` + missingKeys.join(", ")
      );
    }
  }
  return isValidRouteElement;
}
export {
  isNotFoundRoute,
  isRedirectRoute,
  isStandardRoute,
  isValidRoute
};
