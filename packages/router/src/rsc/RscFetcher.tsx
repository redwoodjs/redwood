import type React from 'react'
import { use, useState, useEffect } from 'react'

import type { Options } from 'react-server-dom-webpack/client'
import { createFromFetch, encodeReply } from 'react-server-dom-webpack/client'

import { RscCache } from './RscCache.js'

const BASE_PATH = '/rw-rsc/'

const rscCache = new RscCache()

const initialRscProps = {
  location: {
    pathname: window.location.pathname,
    search: window.location.search,
  },
}
const initialSerializedProps = JSON.stringify(initialRscProps)
const initialRscId = '__rwjs__Routes'
// Prime the cache with the initial RSC response
rscFetch(initialRscId, initialSerializedProps)

export interface RscProps extends Record<string, unknown> {
  location: {
    pathname: string
    search: string
  }
}

let updateCurrentRscCacheKey = (key: string) => {
  console.error('updateCurrentRscCacheKey called before it was set')
  console.error('updateCurrentRscCacheKey key', key)
}

function onStreamFinished(
  fetchPromise: ReturnType<typeof fetch>,
  onFinished: (text: string) => void,
) {
  return (
    fetchPromise
      // clone the response so createFromFetch can use it (otherwise we lock the
      // reader) and wait for the text to be consumed so we know the stream is
      // finished
      .then((response) => response.clone().text())
      .then(onFinished)
  )
}

function rscFetch(rscId: string, serializedProps: string) {
  console.log('rscFetch :: rscId', rscId)
  console.log('rscFetch :: props', serializedProps)
  const rscCacheKey = `${rscId}::${serializedProps}`

  const cached = rscCache.get(rscCacheKey)
  if (cached) {
    console.log('rscFetch :: cache hit for', rscCacheKey)
    return cached
  }

  const searchParams = new URLSearchParams()
  searchParams.set('props', serializedProps)

  // TODO (RSC): During SSR we should not fetch (Is this function really
  // called during SSR?)
  const responsePromise = fetch(BASE_PATH + rscId + '?' + searchParams, {
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
      console.log('RscFetcher :: callServer rsaId', rsaId, 'args', args)

      // Including rsaId here to make sure the page rerenders when calling RSAs
      // Calling a RSA doesn't change the url (i.e. `serializedProps`), and it
      // also doesn't change the rscId, so React would not detect a state change
      // that would trigger a rerender. So we include the rsaId here to make
      // a new cache key that will trigger a rerender.
      // TODO (RSC): What happens if you call the same RSA twice in a row?
      // Like `increment()`
      const rscCacheKey = `${rscId}::${serializedProps}::${rsaId}::${new Date()}`

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

      const responsePromise = fetch(BASE_PATH + id + '?' + searchParams, {
        method: 'POST',
        body,
        headers: {
          'rw-rsc': '1',
        },
      })

      onStreamFinished(responsePromise, (text: string) => {
        console.log(
          'RscFetcher :: callServer response text\n' +
            text
              .replace(/.*__rwjs__rsa_data.*?\s\w+\s\w+\s\w+\s\w+\s\w+"}./s, '')
              .slice(0, 40),
        )

        updateCurrentRscCacheKey(rscCacheKey)
      })

      // I'm not sure this recursive use of `options` is needed. I briefly
      // tried without it, and things seemed to work. But keeping it for
      // now, until we learn more.
      const dataPromise = createFromFetch(responsePromise, options)

      // TODO (RSC): This is where we want to update the RSA cache, but first we
      // need to normalize the data that comes back from the server. We need to
      // always send an object with a `__rwjs__rsa_data` key and some key
      // for the flight data
      // rscCache.set(rscCacheKey, dataPromise)

      const dataValue = await dataPromise
      console.log('RscFetcher :: callServer dataValue', dataValue)
      // TODO (RSC): Fix the types for `createFromFetch`
      // @ts-expect-error The type is wrong for createFromFetch
      const Routes = dataValue.Routes?.[0]
      console.log('Routes', Routes)

      rscCache.set(rscCacheKey, Promise.resolve(Routes))

      // TODO (RSC): Fix the types for `createFromFetch`
      // @ts-expect-error The type is wrong for createFromFetch. It can really
      // return anything, not just React.ReactElement. It all depends on what
      // the server sends back.
      return dataValue.__rwjs__rsa_data
    },
  }

  const componentPromise = createFromFetch<never, React.ReactElement>(
    responsePromise,
    options,
  )

  rscCache.set(rscCacheKey, componentPromise)

  return componentPromise
}

interface Props {
  rscId: string
  rscProps: RscProps
}

export const RscFetcher = ({ rscId, rscProps }: Props) => {
  const serializedProps = JSON.stringify(rscProps)
  const [currentRscCacheKey, setCurrentRscCacheKey] = useState(
    // TODO (RSC): This should be synced with initialRscId and
    // initialSerializedProps
    `${rscId}::${serializedProps}`,
  )

  useEffect(() => {
    console.log('RscFetcher :: useEffect set updateCurrentRscCacheKey')
    updateCurrentRscCacheKey = (key: string) => {
      console.log('RscFetcher inside updateCurrentRscCacheKey', key)

      setCurrentRscCacheKey(key)
    }
  }, [])

  console.log('RscFetcher rerender rscId', rscId, 'rscProps', rscProps)

  useEffect(() => {
    async function fetchRsc() {
      console.log('RscFetcher :: useEffect about to call rscFetch')
      // rscFetch will update the rscCache with the fetched component
      await rscFetch(rscId, serializedProps)
      setCurrentRscCacheKey(`${rscId}::${serializedProps}`)
    }

    fetchRsc()
  }, [rscId, serializedProps])

  console.log('RscFetcher :: rendering cache entry for', currentRscCacheKey)

  const component = rscCache.get(currentRscCacheKey)

  if (!component) {
    console.log('RscFetcher :: no component for', currentRscCacheKey)
    return null
  }

  return use(component)
}
