import React from 'react'

import { ActiveRouteLoader } from './active-route-loader'
import { useActivePageContext } from './ActivePageContext'
import { Redirect } from './links'
import { useLocation, LocationProvider } from './location'
import { PageLoader } from './page-loader'
import { ParamsProvider } from './params'
import {
  RouterContextProvider,
  RouterContextProviderProps,
  useRouterState,
} from './router-context'
import { SplashPage } from './splash-page'
import {
  flattenAll,
  parseSearch,
  replaceParams,
  matchPath,
  validatePath,
  TrailingSlashesTypes,
  ParamType,
  Spec,
  normalizePage,
} from './util'

import type { AvailableRoutes } from './index'

type PageType =
  | Spec
  | React.ComponentType<unknown>
  | ((props: any) => JSX.Element)

interface RouteProps {
  path: string
  page: PageType
  name: string
  prerender?: boolean
  whileLoadingPage?: () => React.ReactElement | null
}

interface RedirectRouteProps {
  path: string
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

function Route(props: RouteProps): JSX.Element
function Route(props: RedirectRouteProps): JSX.Element
function Route(props: NotFoundRouteProps): JSX.Element
function Route(props: RouteProps | RedirectRouteProps | NotFoundRouteProps) {
  return <InternalRoute {...props} />
}

const InternalRoute: React.VFC<InternalRouteProps> = ({
  path,
  name,
  redirect,
  notfound,
}) => {
  const routerState = useRouterState()
  const activePageContext = useActivePageContext()

  /** The not-found route is handled by the router. */
  if (notfound) {
    return null
  }

  const location = activePageContext.loadingState[path]?.location

  if (!location) {
    throw new Error(`No location for route "${name}"`)
  }

  const { params: pathParams } = matchPath(
    path,
    location.pathname,
    routerState.paramTypes
  )

  const searchParams = parseSearch(location.search)
  const allParams = { ...searchParams, ...pathParams }

  if (redirect) {
    const newPath = replaceParams(redirect, allParams)
    return <Redirect to={newPath} />
  }

  const Page = activePageContext.loadingState[path]?.page || (() => null)

  // Level 3/3 (InternalRoute)
  return <Page {...allParams} />
}

/**
 * A user-defined type guard.
 *
 * @see {@link https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates}
 * */
function isRoute(
  node: React.ReactNode
): node is React.ReactElement<InternalRouteProps> {
  return React.isValidElement(node) && node.type === Route
}

interface RouterProps extends RouterContextProviderProps {
  trailingSlashes?: TrailingSlashesTypes
  pageLoadingDelay?: number
}

const Router = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  trailingSlashes = 'never',
  children,
}: React.PropsWithChildren<RouterProps>) => (
  // Level 1/3 (outer-most)
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

/**
 * `namedRoutes` is the `routes` object that you import from `@redwoodjs/router`:
 *
 * ```js
 * import { Link, routes } from '@redwoodjs/router'
 *
 * // ...
 *
 * <Link to={routes.home()}>Home</Link>
 *
 * // ...
 * ```
 *
 * It's populated by the router, at run-time.
 */
const namedRoutes: AvailableRoutes = {}

const LocationAwareRouter = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  children,
}: React.PropsWithChildren<RouterProps>) => {
  const location = useLocation()

  const flatChildArray = flattenAll(children)

  /**
   * Of the router's children that are routes but aren't the not-found route
   * (so routes and redirect routes), validate their props.
   *
   * @remarks
   *
   * Routes need to have `path`, `page`, and `name`,
   * while redirect routes need to have `path` and `redirect`.
   *
   * ```js
   * <Route path="/" page={HomePage} name="home" />  // ok
   * <Route path="/" redirect="/home" />  // ok
   * ```
   */
  flatChildArray
    .filter((child) => isRoute(child) && !child.props.notfound)
    .forEach((child) => {
      const { path, redirect, page, name } = child.props

      if (!path) {
        throw new Error(`Route "${name}" needs to specify a path`)
      }

      validatePath(path)

      if (redirect) {
        validatePath(redirect)
      } else {
        if (!page || !name) {
          throw new Error(
            "A route that's not a redirect or notfound route needs to specify " +
              'both a `page` and a `name`'
          )
        }

        /**
         * Note that this technically makes the router impure.
         *
         * @see {@link https://beta.reactjs.org/learn/keeping-components-pure}
         */
        namedRoutes[name] = (args = {}) => replaceParams(path, args)
      }
    })

  /**
   * The user hasn't generated any routes if the only route that exists is the not-found route:
   *
   * ```js
   * const Routes = () => {
   *   return (
   *     <Router>
   *       <Route notfound page={NotFoundPage} />
   *     </Router>
   *   )
   * }
   * ```
   */
  const hasHomeRoute = flatChildArray.some(
    (child) => isRoute(child) && child.props.path === '/'
  )

  const hasGeneratedRoutes = !(
    flatChildArray.length === 1 &&
    isRoute(flatChildArray[0]) &&
    flatChildArray[0].props.notfound
  )

  /**
   * Figure out if we should show the splash page.
   *
   * We show the splash page if 1) the user doesn't have a home page and is on the home page
   * or 2) the user hasn't generated any routes. In the latter case, the URL doesn't matter.
   */
  const shouldShowSplash =
    (!hasHomeRoute && location.pathname === '/') || !hasGeneratedRoutes

  if (shouldShowSplash && SplashPage !== undefined) {
    return (
      <SplashPage
        hasGeneratedRoutes={hasGeneratedRoutes}
        routes={flatChildArray}
      />
    )
  }

  /**
   * Figure out what to render.
   */
  const { root, activeRoute, NotFoundPage } = analyzeRouterTree(children, {
    pathname: location.pathname,
    paramTypes,
  })

  if (!activeRoute) {
    if (!NotFoundPage) {
      return null
    }

    return (
      <RouterContextProvider useAuth={useAuth} paramTypes={paramTypes}>
        <ParamsProvider>
          <PageLoader
            spec={normalizePage(NotFoundPage)}
            delay={pageLoadingDelay}
          />
        </ParamsProvider>
      </RouterContextProvider>
    )
  }

  const { path, page, redirect, whileLoadingPage } = activeRoute.props

  const { params: pathParams } = matchPath(path, location.pathname, paramTypes)

  const searchParams = parseSearch(location.search)
  const allParams = { ...searchParams, ...pathParams }

  // Level 2/3 (LocationAwareRouter)
  return (
    <RouterContextProvider useAuth={useAuth} paramTypes={paramTypes}>
      {redirect && <Redirect to={replaceParams(redirect, allParams)} />}
      {!redirect && (
        <ActiveRouteLoader
          path={path}
          spec={normalizePage(page)}
          delay={pageLoadingDelay}
          params={allParams}
          whileLoadingPage={whileLoadingPage}
        >
          {root}
        </ActiveRouteLoader>
      )}
    </RouterContextProvider>
  )
}

/**
 * This function analyzes the router's children and returns info pertaining to what to render.
 *
 * @remarks
 *
 * This function is just a wrapper around `reduceRouterTree`, which does most of the actual work.
 * It just provides some variables for `reduceRouterTree` to closer over as it goes through the router's children.
 */
function analyzeRouterTree(
  children: React.ReactNode,
  {
    pathname,
    paramTypes,
  }: {
    pathname: string
    paramTypes?: Record<string, ParamType>
  }
) {
  /** The NotFoundPage, if we find it. We might not if we find the active route first */
  let NotFoundPage: PageType | undefined
  /**
   * The route we're on. Not necessarily what we should render though.
   * (If it's in a Set, we need to render that too, etc)
   */
  let activeRoute: React.ReactElement | undefined

  function isActiveRoute(route: React.ReactElement<InternalRouteProps>) {
    /**
     * @todo We shouldn't have to check this again.
     */
    if (!route.props.path) {
      return false
    }

    const { match } = matchPath(route.props.path, pathname, paramTypes)
    return match
  }

  /**
   * Reduce the router's children down to just what to render.
   *
   * @remarks
   *
   * `children` looks something like this:
   *
   * ```js
   * <Set wrap={MainLayout}>
   *   <Route path="/" page={HomePage} name="home" />
   *   <Route path="/about" page={AboutPage} name="about" />
   *   <Route path="/contact" page={ContactPage} name="contact" />
   * </Set>
   * <Route path="/login" page={LoginPage} name="login" />
   * <Route path="/signup" page={SignupPage} name="signup" />
   * <Route notfound page={NotFoundPage} />
   * <div>Just a div in the router--dont mind me!</div>
   * ```
   */
  function reduceRouterTree(
    children: React.ReactNode
  ): React.ReactElement | undefined {
    const childArray = React.Children.toArray(children)

    return childArray.reduce<React.ReactElement | undefined>(
      (previousValue, child) => {
        /** `previousValue` starts out as `undefined` and only changes after we've found the `activeRoute`. */
        if (previousValue) {
          return previousValue
        }

        /** We found a route. */
        if (isRoute(child)) {
          /** We found the NotFoundPage. */
          if (child.props.notfound && child.props.page) {
            NotFoundPage = child.props.page
          }

          /** We found the active route. */
          if (isActiveRoute(child)) {
            /**
             * React generates a key for all the routes. Something like '.1', '.2', etc.
             * But we know we'll only ever render one route, so we can give all of them the same key.
             * This makes React re-use the element between renders, which helps get rid of "white flashes"
             * when navigating between pages. (The other half of that equation is in `PageLoader`.)
             *
             * @see {@link https://beta.reactjs.org/learn/render-and-commit}
             */
            const childWithKey = React.cloneElement(child, { key: '.rw-route' })

            /** In this case, `activeRoute` and `root` are the same. `activeRoute` is what we should render. */
            activeRoute = childWithKey

            return childWithKey
          }
          /**
           * We found something that's not a route, but has `children`. It's probably a set.
           * Maybe one of its children is the active route. Recurse down a level.
           */
        } else if (React.isValidElement(child) && child.props.children) {
          const nestedActiveRoute = reduceRouterTree(child.props.children)

          /**
           * The set has the active route. But sets usually contain a bunch of routes,
           * so we can't just return it:
           *
           * ```js
           * <Set wrap={MainLayout}>
           *   <Route path="/" page={HomePage} name="home" />
           *   <Route path="/about" page={AboutPage} name="about" />
           *   <Route path="/contact" page={ContactPage} name="contact" />
           * </Set>
           * ```
           *
           * Instead let's clone it, replacing its children with just the active route.
           *
           * @see {@link https://reactjs.org/docs/react-api.html#cloneelement}
           */
          if (nestedActiveRoute) {
            return React.cloneElement(child, undefined, nestedActiveRoute)
          }
        }

        /**
         * Whatever this was definitely didn't belong in the router.
         */
        return previousValue
      },
      undefined
    )
  }

  const root = reduceRouterTree(children)

  return { root, activeRoute, NotFoundPage }
}

export { Router, Route, namedRoutes as routes }
