// TODO (RSC): This should live in @redwoodjs/router but I didn't want to add
// `react-server-dom-webpack` as a dependency there. We should first figure out
// what to do about rscFetch here vs renderFromRscServer and see if maybe that
// one should live somewhere else where @redwoodjs/router can import from

import React, { useEffect, useMemo } from 'react'

import type { Options } from 'react-server-dom-webpack/client'
import { createFromFetch, encodeReply } from 'react-server-dom-webpack/client'

import { analyzeRoutes } from '@redwoodjs/router/dist/analyzeRoutes'
import { LocationProvider, useLocation } from '@redwoodjs/router/dist/location'
import { namedRoutes } from '@redwoodjs/router/dist/namedRoutes'
import type { RouterProps } from '@redwoodjs/router/dist/router'

const BASE_PATH = '/rw-rsc/'

function rscFetch(rscId: string, props: Record<string, unknown> = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('props', JSON.stringify(props))

  // TODO (RSC): During SSR we should not fetch (Is this function really
  // called during SSR?)
  const response = fetch(BASE_PATH + rscId + '?' + searchParams, {
    headers: {
      'rw-rsc': '1',
    },
  })

  const options: Options<unknown[], React.ReactElement> = {
    // React will hold on to `callServer` and use that when it detects a
    // server action is invoked (like `action={onSubmit}` in a <form>
    // element). So for now at least we need to send it with every RSC
    // request, so React knows what `callServer` method to use for server
    // actions inside the RSC.
    callServer: async function (rsfId: string, args: unknown[]) {
      // `args` is often going to be an array with just a single element,
      // and that element will be FormData
      console.log('ClientRouter.ts :: callServer rsfId', rsfId, 'args', args)

      const searchParams = new URLSearchParams()
      searchParams.set('action_id', rsfId)
      const id = '_'

      const response = fetch(BASE_PATH + id + '?' + searchParams, {
        method: 'POST',
        body: await encodeReply(args),
        headers: {
          'rw-rsc': '1',
        },
      })

      // I'm not sure this recursive use of `options` is needed. I briefly
      // tried without it, and things seemed to work. But keeping it for
      // now, until we learn more.
      const data = createFromFetch(response, options)

      return data
    },
  }

  return createFromFetch<never, React.ReactElement>(response, options)
}

let routes: Thenable<React.ReactElement> | null = null

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
  const location = { pathname, search }

  const [renderCount, setRenderCount] = React.useState(0)

  const { namedRoutesMap } = useMemo(() => {
    return analyzeRoutes(children, {
      currentPathName: location.pathname,
      // @TODO We haven't handled this with SSR/Streaming yet.
      // May need a babel plugin to extract userParamTypes from Routes.tsx
      userParamTypes: paramTypes,
    })
  }, [location.pathname, children, paramTypes])

  // Assign namedRoutes so it can be imported like import {routes} from 'rwjs/router'
  // Note that the value changes at runtime
  Object.assign(namedRoutes, namedRoutesMap)

  useEffect(() => {
    setRenderCount((rc) => rc + 1)

    routes = rscFetch('__rwjs__Routes', { location })
  }, [pathname, search])

  // TODO (RSC): Refetch when the location changes
  // It currently works because we always do a full page refresh, but that's
  // not what we really want to do)
  if (!routes) {
    routes = rscFetch('__rwjs__Routes', { location })
  }

  return (
    <>
      {renderCount < -1 && renderCount}
      {routes}
    </>
  )
}
