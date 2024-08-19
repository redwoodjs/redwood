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
var util_exports = {};
__export(util_exports, {
  flattenAll: () => flattenAll,
  flattenSearchParams: () => flattenSearchParams,
  getRouteRegexAndParams: () => getRouteRegexAndParams,
  inIframe: () => inIframe,
  matchPath: () => matchPath,
  paramsForRoute: () => paramsForRoute,
  parseSearch: () => parseSearch,
  replaceParams: () => replaceParams,
  validatePath: () => validatePath
});
module.exports = __toCommonJS(util_exports);
var import_react = require("react");
function flattenAll(children) {
  const childrenArray = import_react.Children.toArray(children);
  return childrenArray.flatMap((child) => {
    if ((0, import_react.isValidElement)(child) && child.props.children) {
      return [child, ...flattenAll(child.props.children)];
    }
    return [child];
  });
}
function paramsForRoute(route) {
  const params = [...route.matchAll(/\{([^}]+)\}/g)];
  return params.map((match) => match[1]).map((match) => {
    const parts = match.split(":");
    let name = parts[0];
    if (name.endsWith("...")) {
      name = name.slice(0, -3);
    }
    let type = parts[1];
    if (!type) {
      type = match.endsWith("...") ? "Glob" : "String";
    }
    return [name, type, `{${match}}`];
  });
}
const coreParamTypes = {
  String: {
    match: /[^/]+/
  },
  Int: {
    match: /\d+/,
    parse: Number
  },
  Float: {
    match: /[-+]?(?:\d*\.?\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/,
    parse: Number
  },
  Boolean: {
    match: /true|false/,
    parse: (boolAsString) => boolAsString === "true"
  },
  Glob: {
    match: /.*/
  }
};
function matchPath(routeDefinition, pathname, {
  userParamTypes,
  matchSubPaths
} = {
  userParamTypes: {},
  matchSubPaths: false
}) {
  const allParamTypes = { ...coreParamTypes, ...userParamTypes };
  const { matchRegex, routeParams: routeParamsDefinition } = getRouteRegexAndParams(routeDefinition, {
    matchSubPaths,
    allParamTypes
  });
  const matches = [...pathname.matchAll(matchRegex)];
  if (matches.length === 0) {
    return { match: false };
  }
  const providedParams = matches[0].slice(1);
  if (routeParamsDefinition.length > 0) {
    const params = providedParams.reduce(
      (acc, value, index) => {
        const [name, transformName] = routeParamsDefinition[index];
        const typeInfo = allParamTypes[transformName];
        let transformedValue = value;
        if (typeof typeInfo?.parse === "function") {
          transformedValue = typeInfo.parse(value);
        }
        return {
          ...acc,
          [name]: transformedValue
        };
      },
      {}
    );
    return { match: true, params };
  }
  return { match: true };
}
function getRouteRegexAndParams(route, {
  matchSubPaths = false,
  allParamTypes = coreParamTypes
} = {}) {
  let typeMatchingRoute = route;
  const routeParams = paramsForRoute(route);
  for (const [_name, type, match] of routeParams) {
    const matcher = allParamTypes[type]?.match;
    const typeRegexp = matcher?.source || "[^/]+";
    typeMatchingRoute = typeMatchingRoute.replace(match, `(${typeRegexp})`);
  }
  const matchRegex = matchSubPaths ? new RegExp(`^${typeMatchingRoute}(?:/.*)?$`, "g") : new RegExp(`^${typeMatchingRoute}$`, "g");
  const matchRegexString = matchSubPaths ? `^${typeMatchingRoute}(?:/.*)?$` : `^${typeMatchingRoute}$`;
  return {
    matchRegex,
    routeParams,
    matchRegexString
  };
}
function parseSearch(search) {
  const searchParams = new URLSearchParams(search);
  return [...searchParams.keys()].reduce(
    (params, key) => ({
      ...params,
      [key]: searchParams.get(key)
    }),
    {}
  );
}
function validatePath(path, routeName) {
  if (!path.startsWith("/")) {
    throw new Error(
      `Route path for ${routeName} does not begin with a slash: "${path}"`
    );
  }
  if (path.includes(" ")) {
    throw new Error(`Route path for ${routeName} contains spaces: "${path}"`);
  }
  if (/{(?:ref|key)(?::|})/.test(path)) {
    throw new Error(
      [
        `Route for ${routeName} contains ref or key as a path parameter: "${path}"`,
        "`ref` and `key` shouldn't be used as path parameters because they're special React props.",
        "You can fix this by renaming the path parameter."
      ].join("\n")
    );
  }
  if (path.length > 2e3) {
    throw new Error(
      `Route path for ${routeName} is too long to process at ${path.length} characters, limit is 2000 characters.`
    );
  }
  const matches = path.matchAll(/\{([^}]+)\}/g);
  const memo = {};
  for (const match of matches) {
    const param = match[1].split(":")[0];
    if (memo[param]) {
      throw new Error(`Route path contains duplicate parameter: "${path}"`);
    } else {
      memo[param] = true;
    }
  }
}
function replaceParams(route, args = {}) {
  const params = paramsForRoute(route);
  let path = route;
  params.forEach((param) => {
    const [name, _type, match] = param;
    const value = args[name];
    if (value !== void 0) {
      path = path.replace(match, value);
    } else {
      throw new Error(
        `Missing parameter '${name}' for route '${route}' when generating a navigation URL.`
      );
    }
  });
  const paramNames = params.map((param) => param[0]);
  const extraArgKeys = Object.keys(args).filter((x) => !paramNames.includes(x));
  const queryParams = [];
  extraArgKeys.forEach((key) => {
    queryParams.push(`${key}=${args[key]}`);
  });
  if (extraArgKeys.length) {
    const extraArgs = Object.fromEntries(
      extraArgKeys.map((key) => [key, `${args[key]}`])
    );
    path += `?${new URLSearchParams(extraArgs).toString()}`;
  }
  return path;
}
function flattenSearchParams(queryString) {
  const searchParams = [];
  for (const [key, value] of Object.entries(parseSearch(queryString))) {
    searchParams.push({ [key]: value });
  }
  return searchParams;
}
function inIframe() {
  try {
    return global?.self !== global?.top;
  } catch {
    return true;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  flattenAll,
  flattenSearchParams,
  getRouteRegexAndParams,
  inIframe,
  matchPath,
  paramsForRoute,
  parseSearch,
  replaceParams,
  validatePath
});
