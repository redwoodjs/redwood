import { cache, use, useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import { createFromFetch, encodeReply } from 'react-server-dom-webpack/client'

import { StatusError } from './lib/StatusError'

const checkStatus = async (
  responsePromise: Promise<Response>
): Promise<Response> => {
  const response = await responsePromise

  if (!response.ok) {
    throw new StatusError(response.statusText, response.status)
  }

  return response
}

const BASE_PATH = '/rw-rsc/'

export function renderFromRscServer<Props>(rscId: string) {
  console.log('serve rscId', rscId)

  type SetRerender = (
    rerender: (next: [ReactElement, string]) => void
  ) => () => void

  const fetchRSC = cache(
    (serializedProps: string): readonly [React.ReactElement, SetRerender] => {
      console.log('fetchRSC serializedProps', serializedProps)

      let rerender: ((next: [ReactElement, string]) => void) | undefined
      const setRerender: SetRerender = (fn) => {
        rerender = fn
        return () => {
          rerender = undefined
        }
      }

      const searchParams = new URLSearchParams()
      searchParams.set('props', serializedProps)

      const options = {
        async callServer(rsfId: string, args: unknown[]) {
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

          const response = fetch(BASE_PATH + id + '/' + searchParams, {
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
        BASE_PATH + rscId + '/' + searchParams
      )

      const response =
        prefetched ||
        fetch(BASE_PATH + rscId + '/' + searchParams, {
          headers: {
            'rw-rsc': '1',
          },
        })
      const data = createFromFetch(checkStatus(response), options)
      console.log('fetchRSC after createFromFetch. data:', data)

      return [data, setRerender]
    }
  )

  // Create temporary client component that wraps the ServerComponent returned
  // by the `createFromFetch` call.
  const ServerComponent = (props: Props) => {
    console.log('ServerComponent', rscId, 'props', props)

    // FIXME we blindly expect JSON.stringify usage is deterministic
    const serializedProps = JSON.stringify(props || {})
    const [data, setRerender] = fetchRSC(serializedProps)
    const [state, setState] = useState<
      [dataToOverride: ReactElement, lastSerializedProps: string] | undefined
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

    // FIXME The type error
    // "Cannot read properties of null (reading 'alternate')"
    // is caused with startTransition.
    // Not sure if it's a React bug or our misusage.
    // For now, using `use` seems to fix it. Is it a correct fix?
    return use(dataToReturn as any) as typeof dataToReturn
  }

  return ServerComponent
}

let mutationMode = 0

export function mutate(fn: () => void) {
  ++mutationMode
  fn()
  --mutationMode
}
