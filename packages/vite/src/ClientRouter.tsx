// TODO (RSC): This should live in @redwoodjs/router but we can't do node
// condition based exports/imports there, so I'm putting it here for now.

import React, { useMemo } from 'react'

import type { GeneratedRoutesMap } from '@redwoodjs/router/dist/analyzeRoutes'
import { analyzeRoutes } from '@redwoodjs/router/dist/analyzeRoutes'
import { LocationProvider, useLocation } from '@redwoodjs/router/dist/location'
import { namedRoutes } from '@redwoodjs/router/dist/namedRoutes'
import { Redirect } from '@redwoodjs/router/dist/redirect'
import type { RouterProps } from '@redwoodjs/router/dist/router'

import { rscFetch } from './rsc/rscFetchForClientRouter'

export const Router = ({ paramTypes, children }: RouterProps) => {
  return (
    // Wrap it in the provider so that useLocation can be used
    <LocationProvider>
      <LocationAwareRouter paramTypes={paramTypes}>
        {children}
      </LocationAwareRouter>
    </LocationProvider>
  )
}

const LocationAwareRouter = ({ paramTypes, children }: RouterProps) => {
  const { pathname, search } = useLocation()

  const { namedRoutesMap, pathRouteMap } = useMemo(() => {
    return analyzeRoutes(children, {
      currentPathName: pathname,
      userParamTypes: paramTypes,
    })
  }, [pathname, children, paramTypes])

  // Assign namedRoutes so it can be imported like import {routes} from 'rwjs/router'
  // Note that the value changes at runtime
  Object.assign(namedRoutes, namedRoutesMap)

  // Use results from `analyzeRoutes` to determine if the user has access to
  // the requested route
  const requestedRoute = pathRouteMap[pathname]

  const privateSet = requestedRoute.sets.find((set) => set.isPrivate)

  if (privateSet) {
    const redirectTarget = privateSet.props.unauthenticated

    if (!redirectTarget || typeof redirectTarget !== 'string') {
      throw new Error(
        `Route ${pathname} is private and no unauthenticated redirect target was provided`,
      )
    }

    // We type cast like this, because AvailableRoutes is generated in the
    // user's project
    const generatedRoutesMap = namedRoutes as GeneratedRoutesMap

    if (!generatedRoutesMap[redirectTarget]) {
      throw new Error(`We could not find a route named ${redirectTarget}`)
    }

    const currentLocation =
      globalThis.location.pathname +
      encodeURIComponent(globalThis.location.search)

    let unauthenticatedPath

    try {
      unauthenticatedPath = generatedRoutesMap[redirectTarget]()
    } catch (e) {
      if (
        e instanceof Error &&
        /Missing parameter .* for route/.test(e.message)
      ) {
        throw new Error(
          `Redirecting to route "${redirectTarget}" would require route ` +
            'parameters, which currently is not supported. Please choose ' +
            'a different route',
        )
      }

      throw new Error(`Could not redirect to the route named ${redirectTarget}`)
    }

    return (
      <Redirect to={`${unauthenticatedPath}?redirectTo=${currentLocation}`} />
    )
  }

  return rscFetch('__rwjs__Routes', { location: { pathname, search } })
}
