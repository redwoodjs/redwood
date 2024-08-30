import type { React } from 'react'
import { useState, useEffect } from 'react'

import type { Options } from 'react-server-dom-webpack/client'
import { createFromFetch, encodeReply } from 'react-server-dom-webpack/client'

import { RscCache } from './RscCache.js'

const BASE_PATH = '/rw-rsc/'

const rscCache = new RscCache()

export interface RscProps extends Record<string, unknown> {
  location: {
    pathname: string
    search: string
  }
}

export function rscFetch(
  rscId: string,
  serializedProps: string,
  // setComponent?: (component: Thenable<React.ReactElement>) => void,
) {
  console.log('rscFetch :: rscId', rscId)
  console.log('rscFetch :: props', serializedProps)

  // TODO (RSC): The cache key should be rscId + serializedProps
  const cached = rscCache.get(serializedProps)
  if (cached) {
    console.log('rscFetch :: cache hit for', serializedProps)
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
      console.log('rscFetchForClientRouter.ts :: callServer')
      console.log('    rsaId', rsaId)
      console.log('    args', args)

      const searchParams = new URLSearchParams()
      searchParams.set('action_id', rsaId)
      searchParams.set('props', serializedProps)
      const id = '_'

      let body: Awaited<ReturnType<typeof encodeReply>> = ''

      try {
        body = await encodeReply(args)
      } catch (e) {
        console.error('Error encoding Server Action arguments', e)
      }

      const response = fetch(BASE_PATH + id + '?' + searchParams, {
        method: 'POST',
        body,
        headers: {
          'rw-rsc': '1',
        },
      })

      // I'm not sure this recursive use of `options` is needed. I briefly
      // tried without it, and things seemed to work. But keeping it for
      // now, until we learn more.
      const data = createFromFetch(response, options)

      const dataValue = await data
      console.log(
        'rscFetchForClientRuoter.ts :: callServer dataValue',
        dataValue,
      )
      // TODO (RSC): Fix the types for `createFromFetch`
      // @ts-expect-error The type is wrong for createFromFetch
      const Routes = dataValue.Routes?.[0]
      console.log('Routes', Routes)

      // TODO (RSC): Figure out how to trigger a rerender of the page with the
      // new Routes

      // TODO (RSC): Fix the types for `createFromFetch`
      // @ts-expect-error The type is wrong for createFromFetch. It can really
      // return anything, not just React.ReactElement. It all depends on what
      // the server sends back.
      return dataValue.__rwjs__rsa_data
    },
  }

  const componentPromise = createFromFetch<never, React.ReactElement>(
    response,
    options,
  )

  rscCache.set(serializedProps, componentPromise)

  return componentPromise
}

interface Props {
  rscId: string
  rscProps: RscProps
}

export const RscFetcher = ({ rscId, rscProps }: Props) => {
  const serializedProps = JSON.stringify(rscProps)
  const [component, setComponent] = useState<any>(() => {
    console.log('RscFetcher :: useState callback')

    return rscFetch(rscId, serializedProps)
  })

  console.log('RscFetcher rerender rscId', rscId)
  console.log('RscFetcher rerender rscProps', rscProps)

  if (!rscCache.get(serializedProps)) {
    rscFetch(rscId, serializedProps)
  }

  useEffect(() => {
    console.log('RscFetcher :: useEffect rscProps')
    const componentPromise = rscFetch(rscId, serializedProps)
    console.log('componentPromise', componentPromise)
    setComponent(componentPromise)
  }, [rscId, serializedProps])

  return component
}
