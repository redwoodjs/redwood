import type { ReactNode } from 'react'
import React, { memo } from 'react'

import { ActiveRouteLoader } from './active-route-loader'
import type {
  AnalyzedRoute,
  analyzeRoutes,
  GeneratedRoutesMap,
} from './analyzeRoutes'
import type { Wrappers } from './analyzeRoutes'
import { AuthenticatedRoute } from './AuthenticatedRoute'
import { LocationProvider, useLocation } from './location'
import { namedRoutes } from './namedRoutes'
import { normalizePage } from './page'
import { PageLoadingContextProvider } from './PageLoadingContext'
import { ParamsProvider } from './params'
import { Redirect } from './redirect'
import type { RouterContextProviderProps } from './router-context'
import { RouterContextProvider } from './router-context'
import { SplashPage } from './splash-page'
import { matchPath, parseSearch, replaceParams, validatePath } from './util'
import type { TrailingSlashesTypes } from './util'

type AnalyzedRouteWithName = AnalyzedRoute & { name: string }

export interface RouterProps
  extends Omit<
    RouterContextProviderProps,
    'routes' | 'activeRouteName' | 'children'
  > {
  trailingSlashes?: TrailingSlashesTypes
  pageLoadingDelay?: number
  analyzedRoutes: Omit<
    ReturnType<typeof analyzeRoutes>,
    'activeRoutePath' | 'namedRoutesMap'
  >
}

export const VirtualClientRouter: React.FC<RouterProps> = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  trailingSlashes = 'never',
  analyzedRoutes,
}) => {
  console.log('client-router.tsx Level 1/3 (outer-most)')
  return (
    // Level 1/3 (outer-most)
    // Wrap it in the provider so that useLocation can be used
    <LocationProvider trailingSlashes={trailingSlashes}>
      <LocationAwareRouter
        useAuth={useAuth}
        paramTypes={paramTypes}
        pageLoadingDelay={pageLoadingDelay}
        analyzedRoutes={analyzedRoutes}
      ></LocationAwareRouter>
    </LocationProvider>
  )
}

const LocationAwareRouter: React.FC<RouterProps> = ({
  useAuth,
  paramTypes,
  pageLoadingDelay,
  analyzedRoutes,
}) => {
  const location = useLocation()
  console.log('client-router.tsx location.href', location.href)

  const { pathRouteMap, hasHomeRoute, NotFoundPage } = analyzedRoutes

  const namedRoutesMap: GeneratedRoutesMap = Object.fromEntries(
    Object.values(analyzedRoutes.pathRouteMap)
      .filter((route): route is AnalyzedRouteWithName => !!route.name)
      .map((route) => {
        return [route.name, (args = {}) => replaceParams(route.path, args)]
      }),
  )

  console.log('pathRouteMap', pathRouteMap)
  console.log('location.pathname', location.pathname)
  console.log('namedRoutesMap', namedRoutesMap)

  // TODO (RSC): Loop through all routes in pathRouteMap and find the one that
  // matches location.pathname. Just have to make sure we loop through them in
  // the correct order. Has to match the order they're defined in the user's
  // Routes file so that the first match is the one that gets rendered.
  // FOR NOW: Just grab the one that matches location.pathname. This won't work
  // for param routes.
  const activeRoutePath = pathRouteMap[location.pathname].path
  console.log('activeRoutePath', activeRoutePath)

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
          routes={{ ...analyzedRoutes, activeRoutePath, namedRoutesMap }}
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

  let redirectPath: string | undefined = undefined

  if (redirect) {
    if (redirect[0] === '/') {
      redirectPath = replaceParams(redirect, allParams)
    } else {
      const redirectRouteObject = Object.values(pathRouteMap).find(
        (route) => route.name === redirect,
      )

      if (!redirectRouteObject) {
        throw new Error(
          `Redirect target route "${redirect}" does not exist for route "${name}"`,
        )
      }

      redirectPath = replaceParams(redirectRouteObject.path, allParams)
    }
  }

  console.log('client-router.tsx Level 2/3 (LocationAwareRouter)')
  console.log('redirectPath', redirectPath)
  console.log('page', page)
  // Level 2/3 (LocationAwareRouter)
  return (
    <RouterContextProvider
      useAuth={useAuth}
      paramTypes={paramTypes}
      routes={{ ...analyzedRoutes, activeRoutePath, namedRoutesMap }}
      activeRouteName={name}
    >
      <ParamsProvider allParams={allParams}>
        <PageLoadingContextProvider delay={pageLoadingDelay}>
          {redirectPath && <Redirect to={redirectPath} />}
          {!redirectPath && page && (
            <WrappedPage sets={sets}>
              {/* Level 3/3 is inside ActiveRouteLoader */}
              <ActiveRouteLoader
                path={path}
                spec={normalizePage(page as any)}
                params={allParams}
                whileLoadingPage={whileLoadingPage as any}
              />
            </WrappedPage>
          )}
        </PageLoadingContextProvider>
      </ParamsProvider>
    </RouterContextProvider>
  )
}

interface WrappedPageProps {
  children: ReactNode
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
const WrappedPage = memo(({ sets, children }: WrappedPageProps) => {
  // @NOTE: don't mutate the wrappers array, it causes full page re-renders
  // Instead just create a new array with the AuthenticatedRoute wrapper

  console.log('client-router.tsx WrappedPage sets', sets)

  // if (Math.random() < 5) {
  //   return <>{children}</>
  // }

  if (!sets || sets.length === 0) {
    return children
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
        acc,
      )
    }, acc)

    console.log('client-router.tsx WrappedPage wrapped', wrapped)

    // If set is private, wrap it in AuthenticatedRoute
    if (set.isPrivate) {
      const unauthenticated = set.props.unauthenticated
      if (!unauthenticated || typeof unauthenticated !== 'string') {
        throw new Error(
          'You must specify an `unauthenticated` route when using PrivateSet',
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
  }, children)
})
