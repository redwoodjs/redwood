// The guts of the router implementation.
/**
 * ! not much typing is done here, because this module looks overcomplicated
 * making it hard to type, and susceptible to hard to debug issues
 */
import React from 'react'
import type { AuthContextInterface } from '@redwoodjs/auth'

import {
  Location,
  parseSearch,
  replaceParams,
  matchPath,
  ParamsContext,
  navigate,
  mapNamedRoutes,
  PageLoader,
  Redirect,
} from './internal'
import { LocationContext } from './location'

import { SplashPage } from './splash-page'

type RouteProps = {
  /**
   * The URL path to match, starting with the beginning slash and
   * should not end with a slash.
   **/
  path: string
  /** The Page component to render when the path is matched. */
  page: React.ComponentType
  /** Used to specify the name of the _named route function_ */
  name: string
  redirect?: string
  /** The route marked notfound is displayed when a page can not be found */
  notfound?: boolean
} & (
  | {
      /** used internally */
      private?: false
      unauthenticatedRedirect?: void
      role?: void
    }
  | {
      /** used internally */
      private: true
      unauthenticatedRedirect: string
      role: string | string[]
    }
)

function Route(_props: RouteProps) {
  return <></>
}

interface PrivateProps {
  /**
   * When a user is not authenticated or is not assigned a role
   * and attempts to visit a route within <Private />,
   * they will be redirected to the route name passed to `unauthenticated`.
   */
  unauthenticated: string
  role: string | string[]
  children?: React.ReactElement<RouteProps>
}

/**
 * `Routes` nested in `Private` require authentication.
 * When a user is not authenticated and attempts to visit this route they will be
 * redirected to `unauthenticated` route.
 */
function Private(_props: PrivateProps) {
  return <></>
}

interface PrivatePageLoaderProps {
  useAuth(): AuthContextInterface
  unauthenticatedRoute: (args?: Record<string, string>) => string
  role?: string | string[]
}

const PrivatePageLoader: React.FC<PrivatePageLoaderProps> = ({
  useAuth,
  unauthenticatedRoute,
  role,
  children,
}) => {
  const { loading, isAuthenticated, hasRole } = useAuth()

  if (loading) {
    return <></>
  }

  if (isAuthenticated && (!role || hasRole(role))) {
    return <>{children}</>
  } else {
    return (
      <Redirect
        to={`${unauthenticatedRoute()}?redirectTo=${window.location.pathname}`}
      />
    )
  }
}

interface RouterProps {
  paramTypes?: any
  pageLoadingDelay?: number
  useAuth?(): AuthContextInterface
  children?: React.ReactElement<PrivateProps | RouteProps>
}

function Router(props: RouterProps) {
  return (
    <Location>
      {(locationContext) => <RouterImpl {...locationContext} {...props} />}
    </Location>
  )
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
 * imported version into a spec. */
function normalizePage<P>(
  specOrPage: React.ComponentType<P> | Spec<P>
): Spec<P> {
  if ('loader' in specOrPage) {
    // Already a spec, just return it.
    return specOrPage
  } else {
    // Wrap the Page in a fresh spec, and put it in a promise to emulate
    // an async module import.
    return {
      name: specOrPage.displayName ?? 'UnnamedComponent',
      loader: async () => ({ default: specOrPage }),
    }
  }
}

export type Spec<P = any> = {
  name: string
  loader: () => Promise<{ default: React.ComponentType<P> }>
}

const DEFAULT_PAGE_LOADING_DELAY = 1000 // milliseconds

type RouterImplProps = LocationContext & RouterProps

function isPrivateChild(
  element: React.ReactElement
): element is React.ReactElement<PrivateProps> {
  return element.type === Private
}

const RouterImpl: React.FC<RouterImplProps> = ({
  pathname,
  search,
  paramTypes,
  pageLoadingDelay = DEFAULT_PAGE_LOADING_DELAY,
  children,
  useAuth = window.__REDWOOD__USE_AUTH,
}) => {
  const routes = React.useMemo(() => {
    if (!React.isValidElement(children))
      throw Error(
        `Invalid React element detected. Expected 'ReactElement', found ${children}`
      )
    // TODO: handle fragments (not flattened by map)
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child))
        throw Error(
          `Invalid React element detected. Expected 'ReactElement', found ${children}`
        )
      if (child.type === Route) return child
      if (!isPrivateChild(child))
        throw Error('Router should only contain `Route` or `Private`')

      const {
        children: internalPrivateChildren,
        unauthenticated,
        role,
      } = child.props

      return (
        internalPrivateChildren &&
        React.Children.map<
          React.ReactElement<RouteProps>,
          React.ReactElement<RouteProps>
        >(internalPrivateChildren, (internalPrivateChild) => {
          if (!React.isValidElement(internalPrivateChild))
            throw Error(
              `Invalid React element detected. Expected 'ReactElement', found ${children}`
            )
          return React.cloneElement(internalPrivateChild, {
            private: true,
            unauthenticatedRedirect: unauthenticated,
            role: role,
          })
        })
      )
    }) as React.ReactElement<RouteProps>[]
  }, [children])

  const namedRoutes = React.useMemo(() => mapNamedRoutes(routes), [routes])

  let NotFoundPage: React.ComponentType = () => <></>

  for (const route of routes) {
    const { path, page: Page, redirect, notfound } = route.props

    if (notfound) {
      NotFoundPage = Page
      continue
    }

    const { match, params: pathParams } = matchPath(path, pathname, paramTypes)

    if (match) {
      const searchParams = parseSearch(search)
      const allParams = { ...pathParams, ...searchParams }

      if (redirect) {
        const newPath = replaceParams(redirect, pathParams)
        navigate(newPath)
        return (
          <RouterImpl pathname={newPath} search={search}>
            {children}
          </RouterImpl>
        )
      } else {
        const Loaders = () => {
          return (
            <ParamsContext.Provider value={allParams}>
              <PageLoader
                spec={normalizePage(Page)}
                delay={pageLoadingDelay}
                params={allParams}
              />
            </ParamsContext.Provider>
          )
        }

        if (route?.props?.private) {
          if (typeof useAuth === 'undefined') {
            throw new Error(
              "You're using a private route, but `useAuth` is undefined. Have you created an AuthProvider, or pased in the incorrect prop to `useAuth`?"
            )
          }
          return (
            <PrivatePageLoader
              useAuth={useAuth}
              unauthenticatedRoute={
                namedRoutes[route.props.unauthenticatedRedirect]
              }
              role={route.props.role}
            >
              <Loaders />
            </PrivatePageLoader>
          )
        }

        return <Loaders />
      }
    }
  }
  // If the router is being used in a Redwood app and only the notfound page is
  // specified, show the Redwood splash page.
  if (routes.length === 1 && NotFoundPage) {
    const isRedwood = typeof __REDWOOD__ !== 'undefined'
    return <SplashPage isRedwood={isRedwood} />
  }

  return (
    <ParamsContext.Provider value={{}}>
      <PageLoader spec={normalizePage(NotFoundPage)} />
    </ParamsContext.Provider>
  )
}

declare let __REDWOOD__: boolean | undefined //? proper place

export { Router, Route, Private }
