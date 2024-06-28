// This is Redwood's routing mechanism. It takes inspiration from both Ruby on
// Rails' routing approach and from both React Router and Reach Router (the
// latter of which has closely inspired some of this code).

export { navigate, back } from './history'
export { NavLink } from './navLink'
export { Link } from './link'
export { useLocation, LocationProvider } from './location'
export { Redirect } from './redirect'
export {
  usePageLoadingContext,
  PageLoadingContextProvider,
} from './PageLoadingContext'
export { useParams, ParamsProvider, ParamsContext } from './params'
export { Router } from './router'
export { Route } from './Route'
export { namedRoutes as routes } from './namedRoutes'

export * from './Set'

export { default as RouteAnnouncement } from './route-announcement'
export * from './route-announcement'
export { default as RouteFocus } from './route-focus'
export * from './route-focus'
export * from './useRouteName'
export * from './useRoutePaths'
export * from './useMatch'

export { parseSearch, getRouteRegexAndParams, matchPath } from './util'

export { SkipNavLink, SkipNavContent } from './skipNav'

/**
 * A more specific interface is created in `.redwood/types/includes/web-routerRoutes`
 * when the site is built, which will describe all known routes.
 *
 * @example
 * interface AvailableRoutes {
 *   home: (params?: RouteParams<"/">) => "/"
 *   post: (params?: RouteParams<"/posts/{id:Int}">) => "/posts/{id:Int}"
 * }
 */
// Keep this in index.ts so it can be extended with declaration merging
export interface AvailableRoutes {}

// Used by packages/internal/src/generate/templates/web-routerRoutes.d.ts.template
export * from './routeParamsTypes'
