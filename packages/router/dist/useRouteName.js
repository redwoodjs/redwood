import { useRouterState } from "./router-context.js";
import { routes } from "./index.js";
function useRouteName() {
  const routerState = useRouterState();
  const routeName = routerState.activeRouteName;
  if (isAvailableRouteName(routeName)) {
    return routeName;
  }
  return void 0;
}
function isAvailableRouteName(name) {
  return typeof name === "string" && Object.keys(routes).includes(name);
}
export {
  useRouteName
};
