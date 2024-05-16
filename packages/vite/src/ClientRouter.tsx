// TODO (RSC): This should live in @redwoodjs/router but I didn't want to add
// `react-server-dom-webpack` as a dependency there. We should first figure out
// what to do about rscFetch here vs renderFromRscServer and see if maybe that
// one should live somewhere else where @redwoodjs/router can import from

import React from 'react'

import type { Options } from 'react-server-dom-webpack/client'
import { createFromFetch, encodeReply } from 'react-server-dom-webpack/client'

import { LocationProvider, useLocation } from '@redwoodjs/router/dist/location'
import { namedRoutes } from '@redwoodjs/router/dist/namedRoutes'

const BASE_PATH = '/rw-rsc/'

function rscFetch(rscId: string, props: Record<string, unknown> = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('props', JSON.stringify(props))

  // TODO (RSC): During SSR we should not fetch
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

      // const isMutating = !!mutationMode
      const searchParams = new URLSearchParams()
      searchParams.set('action_id', rsfId)
      let id: string

      // if (isMutating) {
      if (Math.random() > 5) {
        id = rscId
        // searchParams.set('props', serializedProps)
      } else {
        id = '_'
      }

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

      // if (isMutating) {
      //   rerender?.([data, serializedProps])
      // }

      return data
    },
  }

  return createFromFetch<never, React.ReactElement>(response, options)
}

let serverRoutes: Thenable<React.ReactElement> | null = null

export const ClientRouter = () => {
  Object.assign(namedRoutes, {
    newEmptyUser: () => 'new-empty-user',
    // TODO (RSC): dynamically add all route functions here
  })

  return (
    // Wrap it in the provider so that useLocation can be used
    <LocationProvider>
      <LocationAwareRouter />
    </LocationProvider>
  )
}

const LocationAwareRouter = () => {
  const location = useLocation()

  // TODO (RSC): Refetch when the location changes
  // It currently works because we always do a full page refresh, but that's
  // not what we really want to do)
  if (!serverRoutes) {
    serverRoutes = rscFetch('__rwjs__ServerRoutes', {
      // All we need right now is the pathname. Plus, `location` is a URL
      // object, and it doesn't JSON.stringify well. Basically all you end up
      // with is the href. That's why we manually construct the object here
      // instead of just passing `location`.
      location: { pathname: location.pathname },
    })
  }

  return serverRoutes
}
