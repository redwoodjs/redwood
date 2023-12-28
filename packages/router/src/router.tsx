import type { ReactNode, ReactElement } from 'react'
import React, { useMemo, memo } from 'react'

import { ActiveRouteLoader } from './active-route-loader'
import { AuthenticatedRoute } from './AuthenticatedRoute'
import { Redirect } from './links'
import { LocationProvider, useLocation } from './location'
import { PageLoadingContextProvider } from './PageLoadingContext'
import { ParamsProvider } from './params'
import type {
  NotFoundRouteProps,
  RedirectRouteProps,
  RenderMode,
} from './route-validators'
import { isValidRoute, PageType } from './route-validators'
import type { RouterContextProviderProps } from './router-context'
import { RouterContextProvider } from './router-context'
import { SplashPage } from './splash-page'
import {
  analyzeRoutes,
  matchPath,
  normalizePage,
  parseSearch,
  replaceParams,
  validatePath,
} from './util'
import type { Wrappers, TrailingSlashesTypes } from './util'

import type { AvailableRoutes } from './index'

// namedRoutes is populated at run-time by iterating over the `<Route />`
// components, and appending them to this object.
// Has to be `const`, or there'll be a race condition with imports in users'
// projects
const namedRoutes: AvailableRoutes = {}

export interface RouteProps {
  path: string
  page: PageType
  name: string
  prerender?: boolean
  renderMode?: RenderMode
  whileLoadingPage?: () => ReactElement | null
}

/**
 * Route is now a "virtual" component
 * it is actually never rendered. All the page loading logic happens in active-route-loader
 * and all the validation happens within utility functions called from the Router
 */
function Route(props: RouteProps): JSX.Element
function Route(props: RedirectRouteProps): JSX.Element
function Route(props: NotFoundRouteProps): JSX.Element
function Route(_props: RouteProps | RedirectRouteProps | NotFoundRouteProps) {
  return <></>
}

export interface RouterProps
  extends Omit<RouterContextProviderProps, 'routes' | 'activeRouteName'> {
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

  const analyzeRoutesResult = useMemo(() => {
    return analyzeRoutes(children, {
      currentPathName: location.pathname,
      // @TODO We haven't handled this with SSR/Streaming yet.
      // May need a babel plugin to extract userParamTypes from Routes.tsx
      userParamTypes: paramTypes,
    })
  }, [location.pathname, children, paramTypes])

  const {
    pathRouteMap,
    hasHomeRoute,
    namedRoutesMap,
    NotFoundPage,
    activeRoutePath,
  } = analyzeRoutesResult

  // Assign namedRoutes so it can be imported like import {routes} from 'rwjs/router'
  // Note that the value changes at runtime
  Object.assign(namedRoutes, namedRoutesMap)

  // The user has not generated routes if the only route that exists is the
  // not found page, and that page is not part of the namedRoutes object
  const hasGeneratedRoutes = Object.keys(namedRoutes).length > 0

  const shouldShowSplash =
    (!hasHomeRoute && location.pathname === '/') || !hasGeneratedRoutes

  if (shouldShowSplash && typeof SplashPage !== 'undefined') {
    return (
      <SplashPage
        hasGeneratedRoutes={hasGeneratedRoutes}
        allStandardRoutes={pathRouteMap}
      />
    )
  }

  // Render 404 page if no route matches
  if (!activeRoutePath) {
    if (NotFoundPage) {
      return (
        <RouterContextProvider
          useAuth={useAuth}
          paramTypes={paramTypes}
          routes={analyzeRoutesResult}
        >
          <ParamsProvider>
            <PageLoadingContextProvider delay={pageLoadingDelay}>
              <ActiveRouteLoader
                spec={normalizePage(NotFoundPage)}
                path={location.pathname}
              />
            </PageLoadingContextProvider>
          </ParamsProvider>
        </RouterContextProvider>
      )
    }

    return null
  }

  const { path, page, name, redirect, whileLoadingPage, sets } =
    pathRouteMap[activeRoutePath]

  if (!path) {
    throw new Error(`Route "${name}" needs to specify a path`)
  }

  // Check for issues with the path.
  validatePath(path, name || path)

  const { params: pathParams } = matchPath(path, location.pathname, {
    userParamTypes: paramTypes,
  })

  const searchParams = parseSearch(location.search)
  const allParams = { ...searchParams, ...pathParams }

  // Level 2/3 (LocationAwareRouter)
  return (
    <RouterContextProvider
      useAuth={useAuth}
      paramTypes={paramTypes}
      routes={analyzeRoutesResult}
      activeRouteName={name}
    >
      <ParamsProvider allParams={allParams}>
        <PageLoadingContextProvider delay={pageLoadingDelay}>
          {redirect && <Redirect to={replaceParams(redirect, allParams)} />}
          {!redirect && page && (
            <WrappedPage
              sets={sets}
              routeLoaderElement={
                <ActiveRouteLoader
                  path={path}
                  spec={normalizePage(page as any)}
                  params={allParams}
                  whileLoadingPage={whileLoadingPage as any}
                />
              }
            />
          )}
        </PageLoadingContextProvider>
      </ParamsProvider>
    </RouterContextProvider>
  )
}

interface WrappedPageProps {
  routeLoaderElement: ReactNode
  sets: Array<{
    id: string
    wrappers: Wrappers
    isPrivate: boolean
    props: {
      private?: boolean
      [key: string]: unknown
    }
  }>
}

/**
 * This is effectively a Set (without auth-related code)
 *
 * This means that the <Set> and <PrivateSet> components become "virtual"
 * i.e. they are never actually Rendered, but their props are extracted by the
 * analyze routes function.
 *
 * This is so that we can have all the information up front in the routes-manifest
 * for SSR, but also so that we only do one loop of all the Routes.
 */
const WrappedPage = memo(({ routeLoaderElement, sets }: WrappedPageProps) => {
  // @NOTE: don't mutate the wrappers array, it causes full page re-renders
  // Instead just create a new array with the AuthenticatedRoute wrapper

  if (!sets || sets.length === 0) {
    return routeLoaderElement
  }

  return sets.reduceRight<ReactNode | undefined>((acc, set) => {
    // For each set in `sets`, if you have `<Set wrap={[a,b,c]} p="p" />` then
    // this will return
    // <a p="p"><b p="p"><c p="p"><routeLoaderElement /></c></b></a>
    // If you have `<PrivateSet wrap={[a,b,c]} p="p" />` instead it will return
    // <AuthenticatedRoute>
    //   <a p="p"><b p="p"><c p="p"><routeLoaderElement /></c></b></a>
    // </AuthenticatedRoute>

    // Bundle up all the wrappers into a single element with each wrapper as a
    // child of the previous (that's why we do reduceRight)
    let wrapped = set.wrappers.reduceRight((acc, Wrapper, index) => {
      return React.createElement(
        Wrapper,
        { ...set.props, key: set.id + '-' + index },
        acc
      )
    }, acc)

    // If set is private, wrap it in AuthenticatedRoute
    if (set.isPrivate) {
      const unauthenticated = set.props.unauthenticated
      if (!unauthenticated || typeof unauthenticated !== 'string') {
        throw new Error(
          'You must specify an `unauthenticated` route when using PrivateSet'
        )
      }

      // We do this last, to make sure that none of the wrapper elements are
      // rendered if the user isn't authenticated
      wrapped = (
        <AuthenticatedRoute {...set.props} unauthenticated={unauthenticated}>
          {wrapped}
        </AuthenticatedRoute>
      )
    }

    return wrapped
  }, routeLoaderElement)
})

export {
  Router,
  Route,
  namedRoutes as routes,
  isValidRoute as isRoute,
  PageType,
}
