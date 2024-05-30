// TODO (RSC): This should live in @redwoodjs/router but we can't do node
// condition based exports/imports there, so I'm putting it here for now.

import React, { useMemo } from 'react'

import { analyzeRoutes } from '@redwoodjs/router/dist/analyzeRoutes'
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

  const { namedRoutesMap } = useMemo(() => {
    return analyzeRoutes(children, {
      currentPathName: pathname,
      userParamTypes: paramTypes,
    })
  }, [pathname, children, paramTypes])

  // Assign namedRoutes so it can be imported like import {routes} from 'rwjs/router'
  // Note that the value changes at runtime
  Object.assign(namedRoutes, namedRoutesMap)

  return rscFetch('__rwjs__Routes', { location: { pathname, search } })
}
