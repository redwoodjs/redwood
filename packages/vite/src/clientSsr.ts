import path from 'node:path'

// import { use, createElement } from 'react'
import { createElement } from 'react'

import { createFromReadableStream } from 'react-server-dom-webpack/client.edge'

import { getPaths } from '@redwoodjs/project-config'

import { StatusError } from './lib/StatusError.js'
import { moduleMap } from './streaming/ssrModuleMap.js'

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

// TODO (RSC): Make our own module loading use the same cache as the webpack
// shim for performance
// const moduleLoading = (globalThis as any).__webpack_module_loading__
// const moduleCache = (globalThis as any).__webpack_module_cache__

export function _renderFromDist<TProps>(rscId: string) {
  console.log('renderFromDist rscId', rscId)

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
    )

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

    // const { createFromReadableStream } = await import(
    //   'react-server-dom-webpack/client.edge'
    // )

    // // Like `createFromFetch`
    // const data = createFromReadableStream(stream, {
    //   ssrManifest: { moduleMap, moduleLoading: null },
    // })

    // return use(data)
    // return data
    return 'Loading...'
  }

  return SsrComponent
}

export function renderFromDist(_rscId: string) {
  const SsrComponent = () => {
    const flightStream = new Response(flightText).body

    const data = createFromReadableStream(flightStream, {
      ssrManifest: { moduleMap, moduleLoading: null },
    })

    return data
  }

  return SsrComponent
}

const flightText = `\
2:I["/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-2-ChTgbQz5.mjs",["/Users/tobbe/tmp/test-project-rsc-external-packages-and-cells/web/dist/client/assets/rsc-AboutCounter.tsx-2-ChTgbQz5.mjs"],"AboutCounter"]
0:["$","div",null,{"className":"about-page","children":["$","div",null,{"style":{"border":"3px red dashed","margin":"1em","padding":"1em"},"children":[["$","h1",null,{"children":"About Page"}],["$","$L2",null,{}]]}]}]
1:]`
