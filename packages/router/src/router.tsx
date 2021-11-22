// The guts of the router implementation.

import React from 'react'

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
  isReactElement,
  parseSearch,
  replaceParams,
  matchPath,
  validatePath,
  TrailingSlashesTypes,
  ParamType,
} from './util'

import type { AvailableRoutes } from './index'

// namedRoutes is populated at run-time by iterating over the `<Route />`
// components, and appending them to this object.
const namedRoutes: AvailableRoutes = {}

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
  page,
  name,
  redirect,
  notfound,
  whileLoadingPage,
}) => {
  const location = useLocation()
  const routerState = useRouterState()

  if (notfound) {
    // The "notfound" route is handled by <NotFoundChecker>
    return null
  }

  if (!path) {
    throw new Error(`Route "${name}" needs to specify a path`)
  }

  // Check for issues with the path.
  validatePath(path)

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

  if (!page || !name) {
    throw new Error(
      "A route that's not a redirect or notfound route needs to specify both a `page` and a `name`"
    )
  }

  return (
    <PageLoader
      spec={normalizePage(page)}
      delay={routerState.pageLoadingDelay}
      params={allParams}
      whileLoadingPage={whileLoadingPage}
    />
  )
}

function isRoute(
  node: React.ReactNode
): node is React.ReactElement<InternalRouteProps> {
  return isReactElement(node) && node.type === Route
}

interface RouterProps extends RouterContextProviderProps {
  trailingSlashes?: TrailingSlashesTypes
}

const Router: React.FC<RouterProps> = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  trailingSlashes = 'never',
  children,
}) => (
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

const LocationAwareRouter: React.FC<RouterProps> = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  children,
}) => {
  const { pathname } = useLocation()
  const flatChildArray = flattenAll(children)

  const hasHomeRoute = flatChildArray.some((child) => {
    if (isRoute(child)) {
      return child.props.path === '/'
    }

    return false
  })

  // The user has not generated routes
  // if the only route that exists is
  // is the not found page
  const hasGeneratedRoutes = !(
    flatChildArray.length === 1 &&
    isRoute(flatChildArray[0]) &&
    flatChildArray[0].props.notfound
  )

  const shouldShowSplash =
    (!hasHomeRoute && pathname === '/') || !hasGeneratedRoutes

  flatChildArray.forEach((child) => {
    if (isRoute(child)) {
      const { name, path } = child.props

      if (path) {
        // Check for issues with the path.
        validatePath(path)

        if (name && path) {
          namedRoutes[name] = (args = {}) => replaceParams(path, args)
        }
      }
    }
  })

  if (shouldShowSplash && typeof SplashPage !== 'undefined') {
    return (
      <SplashPage
        hasGeneratedRoutes={hasGeneratedRoutes}
        routes={flatChildArray}
      />
    )
  }

  const { activeRoute, activePath, NotFoundPage } = analyzeRouterTree(
    children,
    pathname,
    paramTypes
  )

  return (
    <RouterContextProvider
      useAuth={useAuth}
      paramTypes={paramTypes}
      pageLoadingDelay={pageLoadingDelay}
    >
      <ParamsProvider path={activePath}>
        {!activeRoute && NotFoundPage && (
          <PageLoader
            spec={normalizePage(NotFoundPage)}
            delay={pageLoadingDelay}
          />
        )}
        {activeRoute}
      </ParamsProvider>
    </RouterContextProvider>
  )
}

/**
 * This function analyzes the routes and returns info pertaining to what to
 * render.
 *  - The element to render, i.e. the active route or the <Set>(s) wrapping it
 *  - The path for the active route
 *  - The NotFoundPage, if we find any. Even if there is a NotFoundPage
 *    specified we might not find it, but only if we first find the active
 *    route, and in that case we don't need the NotFoundPage, so it doesn't
 *    matter.
 */
function analyzeRouterTree(
  children: React.ReactNode,
  pathname: string,
  paramTypes?: Record<string, ParamType>
) {
  let NotFoundPage: PageType | undefined = undefined
  let activePath: string | undefined = undefined

  function isActiveRoute(route: React.ReactElement<InternalRouteProps>) {
    if (route.props.path) {
      const { match } = matchPath(route.props.path, pathname, paramTypes)

      if (match) {
        return true
      }
    }

    return false
  }

  function analyzeRouterTreeInternal(
    children: React.ReactNode
  ): React.ReactElement | undefined {
    return React.Children.toArray(children).reduce<
      React.ReactElement | undefined
    >((previousValue, child) => {
      if (previousValue) {
        return previousValue
      }

      if (isRoute(child)) {
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

          activePath = child.props.path

          return childWithKey
        }
      } else if (isReactElement(child) && child.props.children) {
        // We have a child element that's not a <Route ...>, and that has
        // children. It's probably a <Set>. Recurse down one level
        const nestedActive = analyzeRouterTreeInternal(child.props.children)

        if (nestedActive) {
          // We found something we wanted to keep. So let's return it
          return React.cloneElement(child, child.props, nestedActive)
        }
      }

      return previousValue
    }, undefined)
  }

  const activeRoute = analyzeRouterTreeInternal(children)

  return { activeRoute, activePath, NotFoundPage }
}

function isSpec(specOrPage: Spec | React.ComponentType): specOrPage is Spec {
  return (specOrPage as Spec).loader !== undefined
}

export interface Spec {
  name: string
  loader: () => Promise<{ default: React.ComponentType }>
}

/**
 * Pages can be imported automatically or manually. Automatic imports are actually
 * objects and take the following form (which we call a 'spec'):
 *
 *   const WhateverPage = {
 *     name: 'WhateverPage',
 *     loader: () => import('src/pages/WhateverPage')
 *   }
 *
 * Manual imports simply load the page:
 *
 *   import WhateverPage from 'src/pages/WhateverPage'
 *
 * Before passing a "page" to the PageLoader, we will normalize the manually
 * imported version into a spec.
 */
const normalizePage = (specOrPage: Spec | React.ComponentType): Spec => {
  if (isSpec(specOrPage)) {
    // Already a spec, just return it.
    return specOrPage
  }

  // Wrap the Page in a fresh spec, and put it in a promise to emulate
  // an async module import.
  return {
    name: specOrPage.name,
    loader: async () => ({ default: specOrPage }),
  }
}

export { Router, Route, namedRoutes as routes, isRoute, PageType }
