// TODO (RSC): This should live in @redwoodjs/router but we can't do node
// condition based exports/imports there, so I'm putting it here for now.

import React, { useMemo } from 'react'

import { analyzeRoutes } from '@redwoodjs/router/dist/analyzeRoutes'
import { AuthenticatedRoute } from '@redwoodjs/router/dist/AuthenticatedRoute'
import { LocationProvider, useLocation } from '@redwoodjs/router/dist/location'
import { namedRoutes } from '@redwoodjs/router/dist/namedRoutes'
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

  const requestedRoute = pathRouteMap[pathname]

  // Need to reverse the sets array when finding the private set so that we
  // find the inner-most private set first. Otherwise we could end up
  // redirecting to the wrong route.
  // TODO (RSC): Add tests for finding the correct unauthenticated prop
  const reversedSets = requestedRoute.sets.toReversed()

  const privateSet = reversedSets.find((set) => set.isPrivate)

  if (privateSet) {
    const unauthenticated = privateSet.props.unauthenticated
    if (!unauthenticated || typeof unauthenticated !== 'string') {
      throw new Error(
        'You must specify an `unauthenticated` route when using PrivateSet',
      )
    }

    return (
      <AuthenticatedRoute unauthenticated={unauthenticated}>
        {rscFetch('__rwjs__Routes', { location: { pathname, search } })}
      </AuthenticatedRoute>
    )
  }

  return rscFetch('__rwjs__Routes', { location: { pathname, search } })
}
