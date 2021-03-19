// This is Redwood's routing mechanism. It takes inspiration from both Ruby on
// Rails' routing approach and from both React Router and Reach Router (the
// latter of which has closely inspired some of this code).

export {
  Router,
  Route,
  Private,
  Link,
  NavLink,
  useMatch,
  Redirect,
  routes,
  useParams,
  useLocation,
  LocationProvider,
  navigate,
  PageLoadingContext,
} from './internal'

export * from './Set'

export { usePageLoadingContext } from './page-loader'

export { default as RouteAnnouncement } from './route-announcement'
export * from './route-announcement'

export { SkipNavLink, SkipNavContent } from '@reach/skip-nav'
