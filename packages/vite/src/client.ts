// HACK for react-server-dom-webpack without webpack
;(globalThis as any).__webpack_module_loading__ ||= new Map()
;(globalThis as any).__webpack_module_cache__ ||= new Map()
;(globalThis as any).__webpack_chunk_load__ ||= async (id: string) => {
  console.log('__webpack_chunk_load__ id', id)
  return (globalThis as any).__webpack_module_loading__.get(id)
}
;(globalThis as any).__webpack_require__ ||= (id: string) => {
  console.log('__webpack_require__ id', id)
  return (globalThis as any).__webpack_module_cache__.get(id)
}

console.log('__webpack_require__', __webpack_require__)
console.log("__webpack_require__('FooBar')", __webpack_require__('FooBar'))

import path from 'node:path'
// import url from 'node:url'

import { use, useEffect, useState, createElement } from 'react'
// import { cache, use, useEffect, useState } from 'react'
import type { ReactElement } from 'react'

import type { Options } from 'react-server-dom-webpack/client'
// import RSDWServer from 'react-server-dom-webpack/server.edge'

import { getPaths } from '@redwoodjs/project-config'

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

// async function loadModule<T>(moduleId: string): Promise<T> {
//   console.log('moduleId', moduleId)
//   const clientBuildManifestUrl = url.pathToFileURL(
//     path.join(getPaths().web.distClient, 'client-build-manifest.json'),
//   ).href
//   const clientBuildManifest = (
//     await import(clientBuildManifestUrl, { with: { type: 'json' } })
//   ).default
//   const rsdwClientKey = Object.keys(clientBuildManifest).find((key) =>
//     key.startsWith('_client.edge-'),
//   )
//   console.log('rsdwClientKey', rsdwClientKey)
//   const clientEdgeFileName = clientBuildManifest[rsdwClientKey || ''].file
//   console.log('clientEdgeFileName', clientEdgeFileName)
//   const modFullPath =
//     '/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/'

//   const mod = (await import(modFullPath + clientEdgeFileName)).c
//   console.log('mod', mod)

//   if (mod) {
//     return mod
//   }

//   // TODO (RSC): Making this a 404 error is marked as "HACK" in waku's source
//   throw new StatusError('No module found', 404)
// }

// This gets executed in a RSC server "world" and should return the path to
// the chunk on in the client/browser "world"
function resolveClientEntryForProd(
  filePath: string,
  clientEntries: Record<string, string>,
) {
  const basePath = getPaths().web.distClient
  const entriesFile = getPaths().web.distRscEntries
  const baseDir = path.dirname(entriesFile)
  const absoluteClientEntries = Object.fromEntries(
    Object.entries(clientEntries).map(([key, val]) => {
      let fullKey = path.join(baseDir, key)
      if (process.platform === 'win32') {
        fullKey = fullKey.replaceAll('\\', '/')
      }
      console.log('fullKey', fullKey, 'value', basePath + path.sep + val)
      return [fullKey, basePath + path.sep + val]
    }),
  )

  const filePathSlash = filePath.replaceAll('\\', '/')
  const clientEntry = absoluteClientEntries[filePathSlash]

  console.log('absoluteClientEntries', absoluteClientEntries)
  console.log('resolveClientEntryForProd during SSR - filePath', clientEntry)

  if (!clientEntry) {
    if (absoluteClientEntries['*'] === '*') {
      return basePath + path.relative(getPaths().base, filePathSlash)
    }

    throw new Error('No client entry found for ' + filePathSlash)
  }

  return clientEntry
}

// HACK Patching stream is very fragile.
// TODO (RSC): Sanitize prefixToRemove to make sure it's safe to use in a
// RegExp (CodeQL is complaining on GitHub)
const transformRsfId = (prefixToRemove: string) => {
  // Should be something like /home/runner/work/redwood/test-project-rsa
  console.log('prefixToRemove', prefixToRemove)

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  let data = ''
  return new TransformStream({
    transform(chunk, controller) {
      if (!(chunk instanceof Uint8Array)) {
        throw new Error('Unknown chunk type')
      }

      data += decoder.decode(chunk)
      if (!data.endsWith('\n')) {
        return
      }

      const lines = data.split('\n')

      data = ''
      for (let i = 0; i < lines.length; ++i) {
        const match = lines[i].match(
          new RegExp(
            `^([0-9]+):{"id":"(?:file:///?)?${prefixToRemove}(.*?)"(.*)$`,
          ),
        )
        if (match) {
          lines[i] = `${match[1]}:{"id":"${match[2]}"${match[3]}`
        }
      }

      controller.enqueue(encoder.encode(lines.join('\n')))
    },
  })
}

// ChatGPT version
//
// function transformRsfId(prefixToRemove: string) {
//   // Should be something like /home/runner/work/redwood/test-project-rsa
//   console.log('prefixToRemove', prefixToRemove)

//   return new TransformStream({
//     transform(chunk, controller) {
//       const decoder = new TextDecoder()
//       const encoder = new TextEncoder()
//       const data = decoder.decode(chunk)
//       const lines = data.split('\n')

//       console.log('lines', lines)

//       let changed = false

//       for (let i = 0; i < lines.length; ++i) {
//         const match = lines[i].match(
//           new RegExp(`^([0-9]+):{"id":"${prefixToRemove}(.*?)"(.*)$`),
//         )

//         if (match) {
//           lines[i] = `${match[1]}:{"id":"${match[2]}"${match[3]}`
//           changed = true
//         }
//       }

//       const transformedChunk = changed ? lines.join('\n') : data
//       controller.enqueue(encoder.encode(transformedChunk))
//     },
//   })
// }

// TODO (RSC): Make our own module loading use the same cache as the webpack
// shim for performance
// const moduleLoading = (globalThis as any).__webpack_module_loading__
// const moduleCache = (globalThis as any).__webpack_module_cache__

export function renderFromRscServer<TProps>(rscId: string) {
  console.log('serve rscId', rscId)
  // Temporarily skip rendering this component during SSR
  // I don't know what we actually should do during SSR yet
  if (typeof window === 'undefined') {
    console.log('DOING SSR')
    // if (Math.random() < 5) {
    //   //throw new Error('not SSR')
    //   return 'bazinga'
    // }

    const SsrComponent = async (props: TProps) => {
      console.log('SsrComponent', rscId, 'props', props)

      const component = await getFunctionComponent(rscId)
      const clientEntries = (await getEntries()).clientEntries

      ;(globalThis as any).__webpack_module_loading__ ||= new Map()
      ;(globalThis as any).__webpack_module_cache__ ||= new Map()
      ;(globalThis as any).__webpack_chunk_load__ ||= async (id: string) => {
        console.log('__webpack_chunk_load__ id', id)
        return (globalThis as any).__webpack_module_loading__.get(id)
      }
      ;(globalThis as any).__webpack_require__ ||= (id: string) => {
        console.log('__webpack_require__ id', id)
        return (globalThis as any).__webpack_module_cache__.get(id)
      }

      console.log('__webpack_require__', __webpack_require__)
      console.log(
        "__webpack_require__('FooBar')",
        __webpack_require__('FooBar'),
      )

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

            const id = resolveClientEntryForProd(filePath, clientEntries)

            console.log('Proxy id', id)
            // id /assets/rsc0-beb48afe.js
            return { id, chunks: [id], name, async: true }
          },
        },
      )

      // TODO (RSC): We should look into importing renderToReadableStream from
      // 'react-server-dom-webpack/server.browser' so that we can respond with web
      // streams
      const { renderToReadableStream } = await import(
        'react-server-dom-webpack/server.edge'
      )

      // We're in client.ts, but we're supposed to be pretending we're in the
      // RSC server "world" and that `stream` comes from `fetch`
      const stream = renderToReadableStream(
        // @ts-expect-error - props
        createElement(component, props),
        bundlerConfig,
      ).pipeThrough(transformRsfId(getPaths().base))

      console.log('renderToReadableStream', stream)

      // This is an example of what the stream could look like
      // 2:I{"id":"/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-5-xrVOoNc0.mjs","chunks":["/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-5-xrVOoNc0.mjs"],"name":"AboutCounter","async":false}
      // 0:["$","div",null,{"className":"about-page","children":["$L1",["$","div",null,{"style":{"border":"3px red dashed","margin":"1em","padding":"1em"},"children":[["$","h1",null,{"children":"About Redwood"}],["$","$L2",null,{}],["$","p",null,{"children":["RSC on server: ","enabled"]}]]}]]}]
      // 1:[["$","link",null,{"href":"assets/entry-Cqdoy8Az.css","rel":"stylesheet","precedence":"high"}],["$","link",null,{"href":"assets/AboutPage-Dbp45Pwn.css","rel":"stylesheet","precedence":"high"}],["$","link",null,{"href":"assets/HomePage-CqgNLg45.css","rel":"stylesheet","precedence":"high"}],["$","link",null,{"href":"assets/MultiCellPage-sUDc6C8M.css","rel":"stylesheet","precedence":"high"}]]
      // If you want to look at the stream you can do this:
      // const streamString = await new Response(stream).text()
      // console.log('streamString', streamString)

      // if (Math.random() < 5) {
      //   throw new Error('early exit')
      // }

      const moduleMap = new Proxy(
        {},
        {
          get(_target, filePath: string) {
            return new Proxy(
              {},
              {
                get(_target, name: string) {
                  console.log('nested proxy filePath', filePath)
                  // const file = filePath.slice(config.basePath.length)
                  // // TODO too long, we need to refactor this logic
                  // const id = file
                  // if (!moduleLoading.has(id)) {
                  //   moduleLoading.set(
                  //     id,
                  //     opts
                  //       .loadModule(joinPath(config.ssrDir, id))
                  //       .then((m: any) => {
                  //         moduleCache.set(id, m)
                  //       }),
                  //   )
                  // }
                  const id = filePath.split('/').at(-1)
                  console.log('nested proxy id', id)
                  return { id, chunks: [id], name }
                },
              },
            )
          },
        },
      )

      const { createFromReadableStream } = await import(
        'react-server-dom-webpack/client.edge'
      )
      // const { createFromReadableStream } = await loadModule<any>('RSDW-client')

      // Like `createFromFetch`
      return createFromReadableStream(stream, {
        ssrManifest: { moduleMap, moduleLoading: null },
      })

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
    ;(globalThis as any).__webpack_module_loading__ ||= new Map()
    ;(globalThis as any).__webpack_module_cache__ ||= new Map()
    ;(globalThis as any).__webpack_chunk_load__ ||= async (id: string) => {
      console.log('__webpack_chunk_load__ id', id)
      return (globalThis as any).__webpack_module_loading__.get(id)
    }
    ;(globalThis as any).__webpack_require__ ||= (id: string) => {
      console.log('__webpack_require__ id', id)
      return (globalThis as any).__webpack_module_cache__.get(id)
    }

    console.log('__webpack_require__', __webpack_require__)
    console.log("__webpack_require__('FooBar')", __webpack_require__('FooBar'))

    const { createFromFetch, encodeReply } = await import(
      'react-server-dom-webpack/client.edge'
    )

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
