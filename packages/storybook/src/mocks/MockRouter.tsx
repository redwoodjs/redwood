import type React from 'react'

// Bypass the `main` field in `package.json` because we alias `@redwoodjs/router`
// for jest and Storybook. Not doing so would cause an infinite loop.
// See: ./packages/testing/config/jest/web/jest-preset.js
import { isValidRoute } from '@redwoodjs/router/dist/route-validators'
import type { RouterProps } from '@redwoodjs/router/dist/router'
import { flattenAll, replaceParams } from '@redwoodjs/router/dist/util'

// the compiler didn't like the `import * from '...'` syntax so we have to import each thing individually
export {
  navigate,
  back,
  NavLink,
  Link,
  useLocation,
  LocationProvider,
  Redirect,
  usePageLoadingContext,
  PageLoadingContextProvider,
  useParams,
  ParamsProvider,
  ParamsContext,
  Route,
  WrapperType,
  Set,
  Private,
  PrivateSet,
  isSetNode,
  isPrivateSetNode,
  isPrivateNode,
  RouteAnnouncement,
  RouteAnnouncementProps,
  RouteFocus,
  RouteFocusProps,
  useRouteName,
  useRoutePaths,
  useRoutePath,
  useMatch,
  parseSearch,
  getRouteRegexAndParams,
  matchPath,
  SkipNavLink,
  SkipNavContent,
} from '@redwoodjs/router/dist/index'

export const routes: { [routeName: string]: () => string } = {}

/**
 * We overwrite the default `Router` export (see jest-preset). So every import
 * of @redwoodjs/router will import this Router instead
 *
 * This router populates the `routes.<pageName>()` utility object.
 */
export const Router: React.FC<RouterProps> = ({ children }) => {
  const flatChildArray = flattenAll(children)

  flatChildArray.forEach((child) => {
    if (isValidRoute(child)) {
      const { name, path } = child.props

      if (name && path) {
        routes[name] = (args = {}) => replaceParams(path, args)
      }
    }
  })

  return null
}
