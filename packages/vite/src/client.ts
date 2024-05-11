import React, { cache, use, useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import type { Options } from 'react-server-dom-webpack/client'
import { createFromFetch, encodeReply } from 'react-server-dom-webpack/client'

import { StatusError } from './lib/StatusError.js'

const checkStatus = async (
  responsePromise: Promise<Response>,
): Promise<Response> => {
  const response = await responsePromise

  if (!response.ok) {
    throw new StatusError(response.statusText, response.status)
  }

  return response
}

const BASE_PATH = '/rw-rsc/'

export function renderFromRscServer<TProps>(rscId: string) {
  console.log('serve rscId (renderFromRscServer)', rscId)

  // TODO (RSC): Remove this when we have a babel plugin to call another
  // function during SSR
  if (typeof window === 'undefined') {
    // Temporarily skip rendering this component during SSR
    return null
  }

  if (rscId === 'NavigationLayout') {
    console.log('renderFromRscServer - NavigationLayout')

    // @ts-expect-error I don't care about types, this is just for debugging
    return function HardcodedNavigationLayout(props) {
      return React.createElement('div', {}, [
        'Hardcoded NavigationLayout',
        React.createElement(
          'pre',
          {},
          React.createElement('code', {}, JSON.stringify(props, null, 2)),
        ),
      ])
    }
  }

  type SetRerender = (
    rerender: (next: [Thenable<ReactElement>, string]) => void,
  ) => () => void

  const fetchRSC = cache(
    (
      serializedProps: string,
    ): readonly [Thenable<ReactElement>, SetRerender] => {
      console.log('fetchRSC serializedProps', serializedProps)

      let rerender:
        | ((next: [Thenable<ReactElement>, string]) => void)
        | undefined

      const setRerender: SetRerender = (fn) => {
        rerender = fn
        return () => {
          rerender = undefined
        }
      }

      const searchParams = new URLSearchParams()
      searchParams.set('props', serializedProps)

      const options: Options<unknown[], ReactElement> = {
        // `args` is often going to be an array with just a single element,
        // and that element will be FormData
        callServer: async function (rsfId: string, args: unknown[]) {
          console.log('client.ts :: callServer rsfId', rsfId, 'args', args)

          const isMutating = !!mutationMode
          const searchParams = new URLSearchParams()
          searchParams.set('action_id', rsfId)
          let id: string

          if (isMutating) {
            id = rscId
            searchParams.set('props', serializedProps)
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

          const data = createFromFetch(response, options)

          if (isMutating) {
            rerender?.([data, serializedProps])
          }

          return data
        },
      }

      const prefetched = (globalThis as any).__WAKU_PREFETCHED__?.[rscId]?.[
        serializedProps
      ]

      console.log(
        'fetchRSC before createFromFetch',
        BASE_PATH + rscId + '?' + searchParams,
      )

      const response =
        prefetched ||
        fetch(BASE_PATH + rscId + '?' + searchParams, {
          headers: {
            'rw-rsc': '1',
          },
        })
      const data = createFromFetch(checkStatus(response), options)
      console.log('fetchRSC after createFromFetch. data:', data)

      return [data, setRerender]
    },
  )

  // Create temporary client component that wraps the ServerComponent returned
  // by the `createFromFetch` call.
  const ServerComponent = (props: TProps) => {
    console.log('ServerComponent', rscId, 'props', props)

    // FIXME we blindly expect JSON.stringify usage is deterministic
    const serializedProps = JSON.stringify(props || {})
    const [data, setRerender] = fetchRSC(serializedProps)
    const [state, setState] = useState<
      | [dataToOverride: Thenable<ReactElement>, lastSerializedProps: string]
      | undefined
    >()

    // MARK Should this be useLayoutEffect?
    useEffect(() => setRerender(setState), [setRerender])

    let dataToReturn = data

    if (state) {
      if (state[1] === serializedProps) {
        dataToReturn = state[0]
      } else {
        setState(undefined)
      }
    }

    // `use()` will throw a `SuspenseException` as long as `dataToReturn` is
    // unfulfilled. React internally tracks this promise and re-renders this
    // component when the promise resolves. When the promise is resolved no
    // exception will be thrown and the actual value of the promise will be
    // returned instead
    // The closest suspense boundary will render its fallback when the
    // exception is thrown
    return use(dataToReturn)

    // TODO (RSC): Might be an issue with `use` above with startTransition
    // according to the waku sources I copied this from. We need to figure out
    // if this is the right way to do things
  }

  console.log('return ServerComponent', ServerComponent)
  return ServerComponent
}

let mutationMode = 0

export function mutate(fn: () => void) {
  ++mutationMode
  fn()
  --mutationMode
}
