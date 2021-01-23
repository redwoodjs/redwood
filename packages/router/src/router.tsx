// The guts of the router implementation.

import React, { ReactChild, ReactElement } from 'react'

import { useAuth as useAuthHook } from '@redwoodjs/auth'

import {
  Location,
  parseSearch,
  replaceParams,
  matchPath,
  navigate,
  mapNamedRoutes,
  PageLoader,
  Redirect,
  LocationContextType,
  ParamType,
} from './internal'
import { SplashPage } from './splash-page'

interface RouteProps {
  page: Spec | React.ComponentType<unknown> | ((props: any) => JSX.Element)
  path?: string
  name?: string
  notfound?: Spec | React.ComponentType
  redicect?: string
  whileLoading?: () => ReactChild | null
}

const Route: React.VFC<RouteProps> = () => {
  return null
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
const Private: React.FC<PrivateProps> = () => {
  return null
}

interface PrivatePageLoaderProps {
  useAuth: typeof useAuthHook
  unauthenticatedRoute: (args?: Record<string, string>) => string
  role: string | string[]
  whileLoading?: () => ReactElement | null
}

const PrivatePageLoader: React.FC<PrivatePageLoaderProps> = ({
  useAuth,
  unauthenticatedRoute,
  role,
  whileLoading = () => null,
  children,
}) => {
  const { loading, isAuthenticated, hasRole } = useAuth()

  if (loading) {
    return whileLoading()
  }

  if (
    (isAuthenticated && !role) ||
    (isAuthenticated && role && hasRole(role))
  ) {
    return <>{children || null}</>
  }

  const currentLocation =
    window.location.pathname + encodeURIComponent(window.location.search)
  return (
    <Redirect to={`${unauthenticatedRoute()}?redirectTo=${currentLocation}`} />
  )
}

interface RouterProps {
  useAuth?: typeof useAuthHook
  paramTypes?: Record<string, ParamType>
  pageLoadingDelay?: number
}

const Router: React.FC<RouterProps> = (props) => (
  <Location>
    {(locationContext: LocationContextType) => (
      <RouterImpl {...locationContext} {...props} />
    )}
  </Location>
)

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
 * imported version into a spec. */
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

const DEFAULT_PAGE_LOADING_DELAY = 1000 // milliseconds

interface LoadersProps {
  allParams: Record<string, string>
  Page: Spec | React.ComponentType
  pageLoadingDelay: number
}

const Loaders: React.VFC<LoadersProps> = ({
  allParams,
  Page,
  pageLoadingDelay,
}) => {
  return (
    <PageLoader
      spec={normalizePage(Page)}
      delay={pageLoadingDelay}
      params={allParams}
    />
  )
}

function isReactElement(
  element: Exclude<React.ReactNode, boolean | null | undefined>
): element is ReactElement {
  return (element as ReactElement).type !== undefined
}

interface RouterImplProps {
  pathname: string
  search?: string
  hash?: string
}

const RouterImpl: React.FC<RouterImplProps & RouterProps> = ({
  pathname,
  search,
  paramTypes,
  pageLoadingDelay = DEFAULT_PAGE_LOADING_DELAY,
  children,
  useAuth = useAuthHook,
}) => {
  const routes = React.useMemo(() => {
    // Find `Private` components, mark their children `Route` components as private,
    // and merge them into a single array.
    const privateRoutes =
      React.Children.toArray(children)
        .filter(isReactElement)
        .filter((child) => child.type === Private)
        .map((privateElement) => {
          // Set `Route` props
          const { unauthenticated, role, children } = privateElement.props
          return (
            React.Children.toArray(children)
              // Make sure only valid routes are considered
              .filter(isReactElement)
              .filter((route) => route.type === Route)
              .map((route) =>
                React.cloneElement(route, {
                  private: true,
                  unauthenticatedRedirect: unauthenticated,
                  role: role,
                })
              )
          )
        })
        .reduce((a, b) => a.concat(b), []) || []

    const routes = [
      ...privateRoutes,
      ...React.Children.toArray(children)
        .filter(isReactElement)
        .filter((child) => child.type === Route),
    ]

    return routes
  }, [children])

  const namedRoutes = React.useMemo(() => mapNamedRoutes(routes), [routes])

  let NotFoundPage

  for (const route of routes) {
    const {
      path,
      page: Page,
      redirect,
      notfound,
      private: privateRoute,
      unauthenticatedRedirect,
      whileLoading,
    } = route.props

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
        if (privateRoute) {
          if (typeof useAuth === 'undefined') {
            throw new Error(
              "You're using a private route, but `useAuth` is undefined. " +
                'Have you created an AuthProvider, or passed in the ' +
                'incorrect prop to `useAuth`?'
            )
          }

          return (
            <PrivatePageLoader
              useAuth={useAuth}
              unauthenticatedRoute={namedRoutes[unauthenticatedRedirect]}
              whileLoading={whileLoading}
              role={route.props.role}
            >
              <Loaders
                allParams={allParams}
                Page={Page}
                pageLoadingDelay={pageLoadingDelay}
              />
            </PrivatePageLoader>
          )
        }

        return (
          <Loaders
            allParams={allParams}
            Page={Page}
            pageLoadingDelay={pageLoadingDelay}
          />
        )
      }
    }
  }

  // If the router is being used in a Redwood app and only the notfound page is
  // specified, show the Redwood splash page.
  if (routes.length === 1 && NotFoundPage) {
    const isRedwood = typeof __REDWOOD__ !== 'undefined'
    return <SplashPage isRedwood={isRedwood} />
  }

  return <PageLoader spec={normalizePage(NotFoundPage)} />
}

export { Router, Route, Private }
