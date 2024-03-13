import path from 'node:path'

import { use, useEffect, useState, createElement } from 'react'
// import { cache, use, useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import type { Options } from 'react-server-dom-webpack/client'
import {
  createFromFetch,
  encodeReply,
  createFromReadableStream,
} from 'react-server-dom-webpack/client.edge'
import RSDWServer from 'react-server-dom-webpack/server.edge'

import { getPaths } from '@redwoodjs/project-config'

import { StatusError } from './lib/StatusError.js'

// TODO (RSC): We should look into importing renderToReadableStream from
// 'react-server-dom-webpack/server.browser' so that we can respond with web
// streams
const { renderToReadableStream } = RSDWServer

const checkStatus = async (
  responsePromise: Promise<Response>,
): Promise<Response> => {
  const response = await responsePromise

  if (!response.ok) {
    throw new StatusError(response.statusText, response.status)
  }

  return response
}

const BASE_PATH = 'http://localhost:8910/rw-rsc/'

async function getEntries() {
  const entriesPath = getPaths().web.distRscEntries
  console.log('entriesPath', entriesPath)
  const entries = await import(entriesPath)
  console.log('entries', entries)
  return entries
}

async function getFunctionComponent<Props>(
  rscId: string,
): Promise<React.FunctionComponent<Props>> {
  const {
    default: { getEntry },
  } = await getEntries()
  console.log('getEntry', getEntry)
  const mod = await getEntry(rscId)
  console.log('mod', mod)

  if (typeof mod === 'function') {
    return mod
  }

  if (typeof mod?.default === 'function') {
    return mod?.default
  }

  // TODO (RSC): Making this a 404 error is marked as "HACK" in waku's source
  throw new StatusError('No function component found', 404)
}

async function resolveClientEntryForProd(filePath: string) {
  const basePath = getPaths().web.distRsc
  const entriesFile = getPaths().web.distRscEntries
  const baseDir = path.dirname(entriesFile)
  const clientEntries = (await getEntries()).clientEntries
  const absoluteClientEntries = Object.fromEntries(
    Object.entries(clientEntries).map(([key, val]) => {
      let fullKey = path.join(baseDir, key)
      if (process.platform === 'win32') {
        fullKey = fullKey.replaceAll('\\', '/')
      }
      console.log('fullKey', fullKey, 'value', basePath + val)
      return [fullKey, basePath + val]
    }),
  )

  const filePathSlash = filePath.replaceAll('\\', '/')
  const clientEntry = absoluteClientEntries[filePathSlash]

  console.log('absoluteClientEntries', absoluteClientEntries)
  console.log('filePath', filePathSlash)

  if (!clientEntry) {
    if (absoluteClientEntries['*'] === '*') {
      return basePath + path.relative(getPaths().base, filePathSlash)
    }

    throw new Error('No client entry found for ' + filePathSlash)
  }

  return clientEntry
}

export function renderFromRscServer<TProps>(rscId: string) {
  console.log('serve rscId', rscId)

  // Temporarily skip rendering this component during SSR
  // I don't know what we actually should do during SSR yet
  if (typeof window === 'undefined') {
    console.log('DOING SSR')
    const SsrComponent = async (props: TProps) => {
      console.log('SsrComponent', rscId, 'props', props)

      const component = await getFunctionComponent(rscId)

      // TODO (RSC): Try removing the proxy here and see if it's really necessary.
      // Looks like it'd work to just have a regular object with a getter.
      // Remove the proxy and see what breaks.
      const bundlerConfig = new Proxy(
        {},
        {
          get(_target, encodedId: string) {
            console.log('Proxy get encodedId', encodedId)
            const [filePath, name] = encodedId.split('#') as [string, string]
            // filePath /Users/tobbe/dev/waku/examples/01_counter/dist/assets/rsc0.js
            // name Counter

            const id = resolveClientEntryForProd(filePath)

            console.log('Proxy id', id)
            // id /assets/rsc0-beb48afe.js
            return { id, chunks: [id], name, async: true }
          },
        },
      )

      const stream = renderToReadableStream(
        // @ts-expect-error ...
        createElement(component, props),
        bundlerConfig,
      )
      console.log('createFromStream', stream)

      return createFromReadableStream(stream)

      // FIXME we blindly expect JSON.stringify usage is deterministic
      // const serializedProps = JSON.stringify(props || {})

      // const mod = vite.ssrLoadModule(fname)
      // console.log('ServerComponent res', res)

      // const [data, setRerender] = res
      // const [state, setState] = useState<
      //   | [dataToOverride: Thenable<ReactElement>, lastSerializedProps: string]
      //   | undefined
      // >()

      // // MARK Should this be useLayoutEffect?
      // useEffect(() => setRerender(setState), [setRerender])

      // let dataToReturn = data

      // if (state) {
      //   if (state[1] === serializedProps) {
      //     dataToReturn = state[0]
      //   } else {
      //     setState(undefined)
      //   }
      // }

      // // TODO (RSC): Might be an issue here with startTransition according to the
      // // waku sources I copied this from. We need to figure out if this is the
      // // right way to do things
      // return use(dataToReturn)
    }

    return SsrComponent
  }

  type SetRerender = (
    rerender: (next: [Thenable<ReactElement>, string]) => void,
  ) => () => void

  // const fetchRSC = cache(
  const fetchRSC = async (serializedProps: string): Promise<any> => {
    console.log('fetchRSC serializedProps', serializedProps)

    let rerender: ((next: [Thenable<ReactElement>, string]) => void) | undefined

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
      BASE_PATH + rscId + '/' + searchParams,
    )

    const response =
      prefetched ||
      fetch(BASE_PATH + rscId + '/' + searchParams, {
        headers: {
          'rw-rsc': '1',
        },
      })
    console.log('fetchRSC response', response)
    const res = await response
    console.log('fetchRSC res', res)
    const body = await res.text()
    console.log('fetchRSC body', body)
    const data = createFromFetch(checkStatus(response), options)
    console.log('fetchRSC after createFromFetch. data:', data)

    return [data, setRerender]
  }

  // Create temporary client component that wraps the ServerComponent returned
  // by the `createFromFetch` call.
  const ServerComponent = async (props: TProps) => {
    console.log('ServerComponent', rscId, 'props', props)

    // FIXME we blindly expect JSON.stringify usage is deterministic
    const serializedProps = JSON.stringify(props || {})
    const res = await fetchRSC(serializedProps)
    console.log('ServerComponent res', res)
    const [data, setRerender] = res
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

    // TODO (RSC): Might be an issue here with startTransition according to the
    // waku sources I copied this from. We need to figure out if this is the
    // right way to do things
    return use(dataToReturn)
  }

  return ServerComponent
}

let mutationMode = 0

export function mutate(fn: () => void) {
  ++mutationMode
  fn()
  --mutationMode
}
