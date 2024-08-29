import type { Options } from 'react-server-dom-webpack/client'
import { createFromFetch, encodeReply } from 'react-server-dom-webpack/client'

import { RscCache } from './RscCache.js'

const BASE_PATH = '/rw-rsc/'

const rscCache = new RscCache()

export interface RscFetchProps extends Record<string, unknown> {
  location: {
    pathname: string
    search: string
  }
}

export function rscFetch(rscId: string, props: RscFetchProps) {
  const serializedProps = JSON.stringify(props)

  const cached = rscCache.get(serializedProps)
  if (cached) {
    return cached
  }

  const searchParams = new URLSearchParams()
  searchParams.set('props', serializedProps)

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
    callServer: async function (rsaId: string, args: unknown[]) {
      // `args` is often going to be an array with just a single element,
      // and that element will be FormData
      console.log('ClientRouter.ts :: callServer rsfId', rsaId, 'args', args)

      const searchParams = new URLSearchParams()
      searchParams.set('action_id', rsaId)
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

  const componentPromise = createFromFetch<never, React.ReactElement>(
    response,
    options,
  )

  rscCache.set(serializedProps, componentPromise)

  return componentPromise
}
