import { useLocation } from "./location.js";
import { matchPath } from "./util.js";
const useMatch = (routePath, options) => {
  const location = useLocation();
  if (!location) {
    return { match: false };
  }
  if (options?.searchParams) {
    const locationParams = new URLSearchParams(location.search);
    const hasUnmatched = options.searchParams.some((param) => {
      if (typeof param === "string") {
        return !locationParams.has(param);
      } else {
        return Object.keys(param).some(
          (key) => param[key] != locationParams.get(key)
        );
      }
    });
    if (hasUnmatched) {
      return { match: false };
    }
  }
  const matchInfo = matchPath(routePath, location.pathname, {
    matchSubPaths: options?.matchSubPaths
  });
  if (!matchInfo.match) {
    return { match: false };
  }
  const routeParams = Object.entries(options?.routeParams || {});
  if (routeParams.length > 0) {
    if (!isMatchWithParams(matchInfo) || !matchInfo.params) {
      return { match: false };
    }
    const isParamMatch = routeParams.every(([key, value]) => {
      return matchInfo.params[key] === value;
    });
    if (!isParamMatch) {
      return { match: false };
    }
  }
  return matchInfo;
};
function isMatchWithParams(match) {
  return match !== null && typeof match === "object" && "params" in match;
}
export {
  useMatch
};
