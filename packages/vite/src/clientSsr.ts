// HACK for react-server-dom-webpack without webpack
;(globalThis as any).__webpack_module_loading__ ||= new Map()
;(globalThis as any).__webpack_module_cache__ ||= new Map()
;(globalThis as any).__webpack_chunk_load__ ||= async (id: string) => {
  console.log('clientSsr top __webpack_chunk_load__ id', id)
  return (globalThis as any).__webpack_module_loading__.get(id)
}
;(globalThis as any).__webpack_require__ ||= (id: string) => {
  console.log('clientSsr top __webpack_require__ id', id)
  return (globalThis as any).__webpack_module_cache__.get(id)
}

import path from 'node:path'

import { use, createElement } from 'react'

import { getPaths } from '@redwoodjs/project-config'

import { StatusError } from './lib/StatusError.js'

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

// This gets executed in an RSC server "world" and should return the path to
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

export function renderFromDist<TProps>(rscId: string) {
  console.log('serve rscId', rscId)

  // Create temporary client component that wraps the component (Page, most
  // likely) returned by the `createFromReadableStream` call.
  const SsrComponent = async (props: TProps) => {
    console.log('SsrComponent', rscId, 'props', props)

    const component = await getFunctionComponent(rscId)
    const clientEntries = (await getEntries()).clientEntries

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
    // 2:I{"id":"/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-5-xrVOoNc0.mjs",
    //     "chunks":["/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-5-xrVOoNc0.mjs"],
    //     "name":"AboutCounter","async":false}
    // 0:["$","div",null,{"className":"about-page","children":
    //     ["$L1",["$","div",null,{"style":{"border":"3px red dashed","margin":"1em","padding":"1em"},"children":[["$","h1",null,{"children":"About Redwood"}],
    //       ["$","$L2",null,{}],["$","p",null,{"children":["RSC on server: ","enabled"]}]]}]]}]
    // 1:[["$","link",null,{"href":"assets/entry-Cqdoy8Az.css","rel":"stylesheet","precedence":"high"}],
    //    ["$","link",null,{"href":"assets/AboutPage-Dbp45Pwn.css","rel":"stylesheet","precedence":"high"}],
    //    "$","link",null,{"href":"assets/HomePage-CqgNLg45.css","rel":"stylesheet","precedence":"high"}],
    //    ["$","link",null,{"href":"assets/MultiCellPage-sUDc6C8M.css","rel":"stylesheet","precedence":"high"}]]
    // If you want to look at the stream you can do this:
    // const streamString = await new Response(stream).text()
    // console.log('streamString', streamString)

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

    // Like `createFromFetch`
    const data = createFromReadableStream(stream, {
      ssrManifest: { moduleMap, moduleLoading: null },
    })

    return use(data)
  }

  return SsrComponent
}
