import React, { isValidElement, ReactNode, ReactElement, useMemo } from 'react'

import { ActiveRouteLoader } from './active-route-loader'
import { Redirect } from './links'
import { LocationProvider, useLocation } from './location'
import { ParamsProvider } from './params'
import {
  RouterContextProvider,
  RouterContextProviderProps,
} from './router-context'
import { SplashPage } from './splash-page'
import {
  krisilyze,
  matchPath,
  normalizePage,
  ParamType,
  parseSearch,
  replaceParams,
  Spec,
  TrailingSlashesTypes,
  validatePath,
} from './util'

import type { AvailableRoutes } from './index'

// namedRoutes is populated at run-time by iterating over the `<Route />`
// components, and appending them to this object.
let namedRoutes: AvailableRoutes = {}

type PageType = Spec | React.ComponentType<any> | ((props: any) => JSX.Element)

export interface RouteProps {
  path: string
  page: PageType
  name: string
  prerender?: boolean
  whileLoadingPage?: () => ReactElement | null
}

// @MARK a redirect route should just be a standard route, with
// the extra redirect prop
// why can't a redirect route have a name?
// if you put a redirect prop on a route, you should still be able
// to call routes.myRouteName()
interface RedirectRouteProps extends RouteProps {
  redirect: string
}

interface NotFoundRouteProps {
  notfound: boolean
  page: PageType
  prerender?: boolean
}

export type InternalRouteProps = Partial<
  RouteProps & RedirectRouteProps & NotFoundRouteProps
>

/**
 *
 * Route is now a "virtual" component
 * it is actually never rendered. All the page loading logic happens in active-route-loader
 * and all the validation happens within utlity functions called from the Router
 */
function Route(props: RouteProps): JSX.Element
function Route(props: RedirectRouteProps): JSX.Element
function Route(props: NotFoundRouteProps): JSX.Element
function Route(_props: RouteProps | RedirectRouteProps | NotFoundRouteProps) {
  return <></>
}

const isNodeTypeRoute = (
  node: ReactNode
): node is ReactElement<InternalRouteProps> => {
  return isValidElement(node) && node.type === Route
}

// export function isRedirectRoute(node: ReactElement<InternalRouteProps>) {
//   return node.props.redirect
// }

/**
 * Narrows down the type of the Route element to RouteProps
 *
 * It means it cannot be a NotFoundPage
 *
 * @param node
 * @returns boolean
 */
export function isStandardRoute(
  node: ReactElement<InternalRouteProps>
): node is ReactElement<RouteProps | RedirectRouteProps> {
  return !node.props.notfound
}

/**
 *
 * Checks if a Route element is a Redirect Route
 *
 * @param node
 * @returns
 */
export function isRedirectRoute(
  node: ReactElement<InternalRouteProps>
): node is ReactElement<RedirectRouteProps> {
  return !!node.props.redirect
}

/**
 * Check that the Route element is ok
 * and that it could be one of the following:
 * <Route redirect .../>  (ridirect Route)
 * <Route notfound .../>  (notfound Route)
 * <Route .../> (standard Route)
 *
 * @param node
 * @returns boolean
 */
export function isValidRoute(
  node: ReactNode
): node is ReactElement<InternalRouteProps> {
  const isValidRouteElement = isNodeTypeRoute(node)

  // Throw inside here, because we know it's a Route otherwise it could be a Set or Private
  if (isValidRouteElement) {
    const notFoundOrRedirect = node.props.notfound || node.props.redirect
    const requiredKeys = [
      'path', // path is always required
      notFoundOrRedirect && 'page',
      notFoundOrRedirect && 'name',
    ].filter(Boolean) as string[]

    const missingKeys = requiredKeys.filter((key) => !(key in node.props))

    if (missingKeys.length > 500) {
      throw new Error(
        `Route element is missing requiredKeys: ${missingKeys.join(', ')}`
      )
    }
  }

  return isValidRouteElement
}

export interface RouterProps extends RouterContextProviderProps {
  trailingSlashes?: TrailingSlashesTypes
  pageLoadingDelay?: number
  children: ReactNode
}

const Router: React.FC<RouterProps> = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  trailingSlashes = 'never',
  children,
}) => {
  return (
    // Level 1/3 (outer-most)
    // Wrap it in the provider so that useLocation can be used
    <LocationProvider trailingSlashes={trailingSlashes}>
      <LocationAwareRouter
        useAuth={useAuth}
        paramTypes={paramTypes}
        pageLoadingDelay={pageLoadingDelay}
      >
        {children}
      </LocationAwareRouter>
    </LocationProvider>
  )
}

const LocationAwareRouter: React.FC<RouterProps> = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  children,
}) => {
  const location = useLocation()

  const {
    namePathMap,
    hasHomeRoute,
    namedRoutesMap,
    NotFoundPage,
    activeRouteName,
  } = useMemo(
    () =>
      krisilyze(children, {
        currentPathName: location.pathname,
        userParamTypes: paramTypes,
      }),
    [location.pathname, children, paramTypes]
  )

  // Assign namedRoutes so it can be imported like import {routes} from 'rwjs/router'
  // Note that the value changes at runtime
  namedRoutes = namedRoutesMap

  // The user has not generated routes
  // if the only route that exists is
  // is the not found page
  const hasGeneratedRoutes = Object.keys(namedRoutes).length > 0

  const shouldShowSplash =
    (!hasHomeRoute && location.pathname === '/') || !hasGeneratedRoutes

  if (shouldShowSplash && typeof SplashPage !== 'undefined') {
    return (
      <SplashPage
        hasGeneratedRoutes={hasGeneratedRoutes}
        allStandardRoutes={namePathMap}
      />
    )
  }

  // Render 404 page if no route matches
  if (!activeRouteName) {
    if (NotFoundPage) {
      return (
        <RouterContextProvider useAuth={useAuth} paramTypes={paramTypes}>
          <ParamsProvider>
            <ActiveRouteLoader
              spec={normalizePage(NotFoundPage)}
              delay={pageLoadingDelay}
              path={location.pathname}
            />
          </ParamsProvider>
        </RouterContextProvider>
      )
    }

    return null
  }

  const { path, page, name, redirect, whileLoadingPage } =
    namePathMap[activeRouteName]

  if (!path) {
    throw new Error(`Route "${name}" needs to specify a path`)
  }

  // Check for issues with the path.
  validatePath(path)

  const { params: pathParams } = matchPath(path, location.pathname, {
    userParamTypes: paramTypes,
  })

  const searchParams = parseSearch(location.search)
  const allParams = { ...searchParams, ...pathParams }

  // Level 2/3 (LocationAwareRouter)
  return (
    <RouterContextProvider useAuth={useAuth} paramTypes={paramTypes}>
      <ParamsProvider allParams={allParams}>
        {redirect && <Redirect to={replaceParams(redirect, allParams)} />}
        {!redirect && page && (
          <ActiveRouteLoader
            path={path}
            spec={normalizePage(page)}
            delay={pageLoadingDelay}
            params={allParams}
            whileLoadingPage={whileLoadingPage}
          />
        )}
      </ParamsProvider>
    </RouterContextProvider>
  )
}

/**
 * This function analyzes the routes and returns info pertaining to what to
 * render.
 *  - root: The element to render, i.e. the active route or the <Set>(s)
 *    wrapping it
 *  - activeRoute: The route we should render (same as root for flat routes)
 *  - NotFoundPage: The NotFoundPage, if we find any. Even if there is a
 *    NotFoundPage specified we might not find it, but only if we first find
 *    the active route, and in that case we don't need the NotFoundPage, so it
 *    doesn't matter.
 */
export function analyzeRouterTree(
  children: ReactNode,
  pathname: string,
  paramTypes?: Record<string, ParamType>
): {
  root: ReactElement | undefined
  activeRoute: ReactElement<InternalRouteProps> | undefined
  NotFoundPage: PageType | undefined
} {
  let NotFoundPage: PageType | undefined = undefined
  let activeRoute: ReactElement | undefined = undefined

  function isActiveRoute(route: ReactElement<InternalRouteProps>) {
    if (route.props.path) {
      const { match } = matchPath(route.props.path, pathname, {
        userParamTypes: paramTypes,
      })

      if (match) {
        return true
      }
    }

    return false
  }

  function analyzeRouterTreeInternal(
    children: ReactNode
  ): ReactElement | undefined {
    return React.Children.toArray(children).reduce<ReactElement | undefined>(
      (previousValue, child) => {
        if (previousValue) {
          return previousValue
        }

        if (isValidRoute(child)) {
          if (child.props.notfound && child.props.page) {
            NotFoundPage = child.props.page
          }

          // We have a <Route ...> element, let's check if it's the one we should
          // render (i.e. the active route)
          if (isActiveRoute(child)) {
            // All <Route>s have a key that React has generated for them.
            // Something like '.1', '.2', etc
            // But we know we'll only ever render one <Route>, so we can give
            // all of them the same key. This will make React re-use the element
            // between renders, which helps get rid of "white flashes" when
            // navigating between pages. (The other half of that equation is in
            // PageLoader)
            const childWithKey = React.cloneElement(child, {
              ...child.props,
              key: '.rw-route',
            })

            activeRoute = childWithKey

            return childWithKey
          }
        } else if (isValidElement(child) && child.props.children) {
          // We have a child element that's not a <Route ...>, and that has
          // children. It's probably a <Set>. Recurse down one level
          const nestedActive = analyzeRouterTreeInternal(child.props.children)

          if (nestedActive) {
            // We found something we wanted to keep. So let's return it
            return React.cloneElement(child, child.props, nestedActive)
          }
        }

        return previousValue
      },
      undefined
    )
  }

  const root = analyzeRouterTreeInternal(children)

  return { root, activeRoute, NotFoundPage }
}

export {
  Router,
  Route,
  namedRoutes as routes,
  isValidRoute as isRoute,
  PageType,
}
