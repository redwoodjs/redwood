"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.getDuplicateRoutes = getDuplicateRoutes;
exports.getProjectRoutes = void 0;
exports.warningForDuplicateRoutes = warningForDuplicateRoutes;
require("core-js/modules/es.array.push.js");
var _set = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/set"));
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _trimEnd = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/trim-end"));
var _path = _interopRequireDefault(require("path"));
var _chalk = _interopRequireDefault(require("chalk"));
var _projectConfig = require("@redwoodjs/project-config");
var _router = require("@redwoodjs/router");
var _index = require("@redwoodjs/structure/dist/index.js");
/**
 * Returns an array of routes which conflict on their defined names
 */
function getDuplicateRoutes() {
  var _context;
  const duplicateRoutes = [];
  const allRoutes = (0, _index.getProject)((0, _projectConfig.getPaths)().base).router.routes;
  const uniqueNames = new _set.default((0, _map.default)(_context = (0, _filter.default)(allRoutes).call(allRoutes, route => route.name !== undefined)).call(_context, route => route.name));
  (0, _forEach.default)(uniqueNames).call(uniqueNames, name => {
    const routesWithName = (0, _filter.default)(allRoutes).call(allRoutes, route => {
      return route.name === name;
    });
    if (routesWithName.length > 1) {
      duplicateRoutes.push(...(0, _map.default)(routesWithName).call(routesWithName, route => {
        return {
          name: route.name,
          page: route.page_identifier_str,
          path: route.path
        };
      }));
    }
  });
  return duplicateRoutes;
}

/**
 * Detects any potential duplicate routes and returns a formatted warning message
 * @see {@link getDuplicateRoutes} for how duplicate routes are detected
 * @return {string} Warning message when duplicate routes found, empty string if not
 */
function warningForDuplicateRoutes() {
  const duplicatedRoutes = getDuplicateRoutes();
  let message = '';
  if (duplicatedRoutes.length > 0) {
    message += _chalk.default.keyword('orange')(`Warning: ${duplicatedRoutes.length} duplicate routes have been detected, only the route(s) closest to the top of the file will be used.\n`);
    (0, _forEach.default)(duplicatedRoutes).call(duplicatedRoutes, route => {
      message += ` ${_chalk.default.keyword('orange')('->')} Name: "${route.name}", Path: "${route.path}", Page: "${route.page}"\n`;
    });
  }
  return (0, _trimEnd.default)(message).call(message);
}
const getProjectRoutes = () => {
  const rwProject = (0, _index.getProject)((0, _projectConfig.getPaths)().base);
  const routes = rwProject.getRouter().routes;

  // @ts-expect-error "Bundle" is not found but is in the Spec type?
  return (0, _map.default)(routes).call(routes, route => {
    const {
      matchRegexString,
      routeParams
    } = route.isNotFound ? {
      matchRegexString: null,
      routeParams: null
    } : (0, _router.getRouteRegexAndParams)(route.path);
    return {
      name: route.isNotFound ? 'NotFoundPage' : route.name,
      pathDefinition: route.isNotFound ? 'notfound' : route.path,
      hasParams: route.hasParameters,
      id: route.id,
      isNotFound: route.isNotFound,
      filePath: route.page?.filePath,
      relativeFilePath: route.page?.filePath ? _path.default.relative((0, _projectConfig.getPaths)().web.src, route.page?.filePath) : undefined,
      routeHooks: (0, _projectConfig.getRouteHookForPage)(route.page?.filePath),
      renderMode: route.renderMode,
      matchRegexString: matchRegexString,
      paramNames: routeParams,
      // TODO (STREAMING) deal with permanent/temp later
      redirect: route.redirect ? {
        to: route.redirect,
        permanent: false
      } : null,
      isPrivate: route.isPrivate,
      unauthenticated: route.unauthenticated,
      roles: route.roles,
      pageIdentifier: route.page_identifier_str
    };
  });
};
exports.getProjectRoutes = getProjectRoutes;