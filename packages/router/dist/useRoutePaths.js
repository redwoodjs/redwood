import { useRouterState } from "./router-context.js";
import { useRouteName } from "./useRouteName.js";
function useRoutePaths() {
  const routerState = useRouterState();
  const routePaths = Object.values(routerState.routes.pathRouteMap).reduce((routePathsAcc, currRoute) => {
    if (currRoute.name) {
      routePathsAcc[currRoute.name] = currRoute.path;
    }
    return routePathsAcc;
  }, {});
  return routePaths;
}
function useRoutePath(routeName) {
  const currentRouteName = useRouteName();
  const routePaths = useRoutePaths();
  const name = routeName || currentRouteName;
  if (!name) {
    return void 0;
  }
  return routePaths[name];
}
export {
  useRoutePath,
  useRoutePaths
};
