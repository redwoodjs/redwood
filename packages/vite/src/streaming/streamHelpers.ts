import path from 'node:path'

import React from 'react'

import type {
  RenderToReadableStreamOptions,
  ReactDOMServerReadableStream,
} from 'react-dom/server'
import { renderToReadableStream } from 'react-dom/server.edge'

import type { ServerAuthState } from '@redwoodjs/auth'
import { ServerAuthProvider } from '@redwoodjs/auth'
import { getPaths } from '@redwoodjs/project-config'
import { LocationProvider } from '@redwoodjs/router'
import type { TagDescriptor } from '@redwoodjs/web'
// @TODO (ESM), use exports field. Cannot import from web because of index exports
import {
  ServerHtmlProvider,
  createInjector,
} from '@redwoodjs/web/dist/components/ServerInject'

import { StatusError } from '../lib/StatusError.js'
import type { MiddlewareResponse } from '../middleware/MiddlewareResponse.js'

import { createBufferedTransformStream } from './transforms/bufferedTransform.js'
import { createTimeoutTransform } from './transforms/cancelTimeoutTransform.js'
import { createServerInjectionTransform } from './transforms/serverInjectionTransform.js'

interface RenderToStreamArgs {
  ServerEntry: any
  FallbackDocument: any
  currentPathName: string
  metaTags: TagDescriptor[]
  cssLinks: string[]
  isProd: boolean
  jsBundles?: string[]
  authState: ServerAuthState
}

interface StreamOptions {
  waitForAllReady?: boolean
  onError?: (err: Error) => void
}

export async function reactRenderToStreamResponse(
  mwRes: MiddlewareResponse,
  renderOptions: RenderToStreamArgs,
  streamOptions: StreamOptions,
) {
  const { waitForAllReady = false } = streamOptions
  const {
    ServerEntry,
    FallbackDocument,
    currentPathName,
    metaTags,
    cssLinks,
    isProd,
    jsBundles = [],
    authState,
  } = renderOptions

  if (!isProd) {
    // For development, we need to inject the react-refresh runtime
    jsBundles.push(path.join(__dirname, '../../inject', 'reactRefresh.js'))
  }

  const assetMap = JSON.stringify({
    css: cssLinks,
    meta: metaTags,
  })

  // This ensures an isolated state for each request
  const { injectionState, injectToPage } = createInjector()

  // This makes it safe for us to inject at any point in the stream
  const bufferTransform = createBufferedTransformStream()

  // This is a transformer stream, that will inject all things called with useServerInsertedHtml
  const serverInjectionTransform = createServerInjectionTransform({
    injectionState,
    onlyOnFlush: waitForAllReady,
  })

  // Timeout after 10 seconds
  // @TODO make this configurable
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => {
    controller.abort()
  }, 10000)

  const timeoutTransform = createTimeoutTransform(timeoutHandle)

  // Possible that we need to upgrade the @types/* packages
  //// @ts-expect-error Something in React's packages mean types don't come through
  // const { renderToReadableStream } = await import('react-dom/server.edge')

  const renderRoot = (path: string) => {
    return React.createElement(
      ServerAuthProvider,
      {
        value: authState,
      },
      React.createElement(
        LocationProvider,
        {
          location: {
            pathname: path,
          },
        },
        React.createElement(
          ServerHtmlProvider,
          {
            value: injectToPage,
          },
          ServerEntry({
            url: path,
            css: cssLinks,
            meta: metaTags,
          }),
        ),
      ),
    )
  }

  if (Math.random() > 5) {
    console.log('renderRoot', renderRoot)
  }

  /**
   * These are the opts that inject the bundles, and Assets into html
   */
  const bootstrapOptions = {
    bootstrapScriptContent:
      // Only insert assetMap if client side JS will be loaded
      jsBundles.length > 0
        ? `window.__REDWOOD__ASSET_MAP = ${assetMap};`
        : undefined,
    bootstrapModules: jsBundles,
  }

  try {
    // This gets set if there are errors inside Suspense boundaries
    let didErrorOutsideShell = false

    // Assign here so we get types, the dynamic import messes types
    const renderToStreamOptions: RenderToReadableStreamOptions = {
      ...bootstrapOptions,
      signal: controller.signal,
      onError: (err: any) => {
        didErrorOutsideShell = true
        console.error('🔻 Caught error outside shell')
        streamOptions.onError?.(err)
      },
    }

    console.log('streamHelpers - currentPathName', currentPathName)
    // const root = renderRoot(currentPathName)
    // const root: ReturnType<typeof renderRoot> =
    const root = await renderFromDist('AboutPage')

    console.log('root')
    console.log('root')
    console.log('root', root)
    console.log('root')
    console.log('root')

    const reactStream: ReactDOMServerReadableStream =
      await renderToReadableStream(
        React.createElement(root),
        renderToStreamOptions,
      )

    // @NOTE: very important that we await this before we apply any transforms
    if (waitForAllReady) {
      await reactStream.allReady
    }

    const transformsToApply = [
      !waitForAllReady && bufferTransform,
      serverInjectionTransform,
      !waitForAllReady && timeoutTransform,
    ]

    const outputStream: ReadableStream<Uint8Array> = applyStreamTransforms(
      reactStream,
      transformsToApply,
    )

    mwRes.status = didErrorOutsideShell ? 500 : 200
    mwRes.body = outputStream
    mwRes.headers.set('content-type', 'text/html')

    return mwRes.toResponse()
  } catch (e) {
    console.error('🔻 Failed to render shell')
    streamOptions.onError?.(e as Error)

    // @TODO Asking for clarification from React team. Their documentation on this is incomplete I think.
    // Having the Document (and bootstrap scripts) here allows client to recover from errors in the shell
    // To test this, throw an error in the App on the server only
    const fallbackShell = await renderToReadableStream(
      FallbackDocument({
        children: null,
        css: cssLinks,
        meta: metaTags,
      }),
      bootstrapOptions,
    )

    mwRes.status = 500
    mwRes.body = fallbackShell
    mwRes.headers.set('content-type', 'text/html')

    return mwRes.toResponse()
  } finally {
    clearTimeout(timeoutHandle)
  }
}
function applyStreamTransforms(
  reactStream: ReactDOMServerReadableStream,
  transformsToApply: (TransformStream | false)[],
) {
  let outputStream: ReadableStream<Uint8Array> = reactStream

  for (const transform of transformsToApply) {
    // If its false, skip
    if (!transform) {
      continue
    }
    outputStream = outputStream.pipeThrough(transform)
  }

  return outputStream
}

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

async function renderFromDist<TProps>(rscId: string) {
  console.log('streamHelpers - renderFromDist rscId', rscId)

  const component = await getFunctionComponent(rscId)
  const clientEntries = (await getEntries()).clientEntries

  // TODO (RSC): We should look into importing renderToReadableStream from
  // 'react-server-dom-webpack/server.browser' so that we can respond with web
  // streams
  const { renderToReadableStream } = await import(
    'react-server-dom-webpack/server.edge'
  )

  // Create temporary client component that wraps the component (Page, most
  // likely) returned by the `createFromReadableStream` call.
  const SsrComponent = (props: TProps) => {
    console.log('streamHelpers - SsrComponent', rscId, 'props', props)

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

    // const moduleMap = new Proxy(
    //   {},
    //   {
    //     get(_target, filePath: string) {
    //       return new Proxy(
    //         {},
    //         {
    //           get(_target, name: string) {
    //             console.log('nested proxy filePath', filePath)
    //             // const file = filePath.slice(config.basePath.length)
    //             // // TODO too long, we need to refactor this logic
    //             // const id = file
    //             // if (!moduleLoading.has(id)) {
    //             //   moduleLoading.set(
    //             //     id,
    //             //     opts
    //             //       .loadModule(joinPath(config.ssrDir, id))
    //             //       .then((m: any) => {
    //             //         moduleCache.set(id, m)
    //             //       }),
    //             //   )
    //             // }
    //             const id = filePath.split('/').at(-1)
    //             console.log('nested proxy id', id)
    //             return { id, chunks: [id], name }
    //           },
    //         },
    //       )
    //     },
    //   },
    // )

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
