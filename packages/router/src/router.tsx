// The guts of the router implementation.

import React, { ReactChild } from 'react'

import {
  parseSearch,
  replaceParams,
  matchPath,
  PageLoader,
  Redirect,
  useLocation,
  validatePath,
  LocationProvider,
} from './internal'
import { PrivateContextProvider, usePrivate } from './private-context'
import {
  RouterContextProvider,
  RouterState,
  useRouterState,
} from './router-context'
import { SplashPage } from './splash-page'
import { flattenAll, isReactElement } from './util'

/**
 * A more specific interface will be generated by
 * babel-plugin-redwood-routes-auto-loader when a redwood project is built
 *
 * Example:
 * interface AvailableRoutes {
 *   home: () => "/"
 *   test: () => "/test"
 * }
 */
interface AvailableRoutes {
  [key: string]: (args?: Record<string, string>) => string
}

const namedRoutes: AvailableRoutes = {}

type PageType =
  | Spec
  | React.ComponentType<unknown>
  | ((props: any) => JSX.Element)

interface RouteProps {
  path?: string
  page?: PageType
  name?: string
  notfound?: boolean
  redirect?: string
  prerender?: boolean
  whileLoading?: () => ReactChild | null
}

const Route: React.VFC<RouteProps> = ({
  path,
  page,
  name,
  redirect,
  notfound,
  whileLoading,
}) => {
  const location = useLocation()
  const routerState = useRouterState()
  const { isPrivate, allowRender, unauthenticated } = usePrivate()

  if (notfound) {
    // The "notfound" route is handled by <NotFoundChecker>
    return null
  }

  if (!path) {
    throw new Error(`Route "${name}" needs to specify a path`)
  }

  // Check for issues with the path.
  validatePath(path)

  const { match, params: pathParams } = matchPath(
    path,
    location.pathname,
    routerState.paramTypes
  )

  if (!match) {
    return null
  }

  if (isPrivate) {
    const { loading } = routerState.useAuth()

    if (loading) {
      return <>{whileLoading?.() || null}</>
    }

    if (!allowRender()) {
      const currentLocation =
        global.location.pathname + encodeURIComponent(global.location.search)

      return (
        <Redirect
          to={`${namedRoutes[unauthenticated]()}?redirectTo=${currentLocation}`}
        />
      )
    }
  }

  const searchParams = parseSearch(location.search)
  const allParams = { ...pathParams, ...searchParams }

  if (redirect) {
    const newPath = replaceParams(redirect, allParams)
    return <Redirect to={newPath} />
  }

  if (!page || !name) {
    return null
  }

  return (
    <PageLoader
      spec={normalizePage(page)}
      delay={routerState.pageLoadingDelay}
      params={allParams}
    />
  )
}

interface PrivateProps {
  /** The page name where a user will be redirected when not authenticated */
  unauthenticated: string
  role?: string | string[]
}

/**
 * `Routes` nested in `Private` require authentication.
 * When a user is not authenticated and attempts to visit this route they will be
 * redirected to `unauthenticated` route.
 */
const Private: React.FC<PrivateProps> = ({
  children,
  unauthenticated,
  role,
}) => {
  return (
    <PrivateContextProvider
      isPrivate={true}
      role={role}
      unauthenticated={unauthenticated}
    >
      {children}
    </PrivateContextProvider>
  )
}

function isRoute(
  node: React.ReactNode
): node is React.ReactElement<RouteProps> {
  return isReactElement(node) && node.type === Route
}

interface RouterProps extends RouterState {}

const Router: React.FC<RouterProps> = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  children,
}) => {
  const flatChildArray = flattenAll(children)
  const shouldShowSplash =
    flatChildArray.length === 1 &&
    isRoute(flatChildArray[0]) &&
    flatChildArray[0].props.notfound

  if (shouldShowSplash) {
    return <SplashPage />
  }

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

  return (
    <RouterContextProvider
      useAuth={useAuth}
      paramTypes={paramTypes}
      pageLoadingDelay={pageLoadingDelay}
    >
      <LocationProvider>
        <NotFoundChecker>
          <>{children}</>
        </NotFoundChecker>
      </LocationProvider>
    </RouterContextProvider>
  )
}

const NotFoundChecker: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const location = useLocation()
  const routerState = useRouterState()

  let foundMatchingRoute = false
  let NotFoundPage: PageType | undefined = undefined
  const flatChildArray = flattenAll(children)

  flatChildArray.forEach((child) => {
    if (isRoute(child)) {
      const { path } = child.props

      if (path) {
        const { match } = matchPath(
          path,
          location.pathname,
          routerState.paramTypes
        )

        if (match) {
          foundMatchingRoute = true
        }
      }

      if (child.props.notfound && child.props.page) {
        NotFoundPage = child.props.page
      }
    }
  })

  if (!foundMatchingRoute && NotFoundPage) {
    return (
      <PageLoader
        spec={normalizePage(NotFoundPage)}
        delay={routerState.pageLoadingDelay}
      />
    )
  }

  return <>{children}</>
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

export { Router, Route, Private, namedRoutes as routes, isRoute }
