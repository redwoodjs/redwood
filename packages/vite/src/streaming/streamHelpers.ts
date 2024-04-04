import path from 'node:path'

import React from 'react'

import type {
  RenderToReadableStreamOptions,
  ReactDOMServerReadableStream,
} from 'react-dom/server'
import type { default as RDServerModule } from 'react-dom/server.edge'

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

import { renderFromDist } from '../clientSsr.js'
import type { MiddlewareResponse } from '../middleware/MiddlewareResponse.js'
import type { ServerEntryType } from '../types.js'

import { createBufferedTransformStream } from './transforms/bufferedTransform.js'
import { createTimeoutTransform } from './transforms/cancelTimeoutTransform.js'
import { createServerInjectionTransform } from './transforms/serverInjectionTransform.js'

type RDServerType = typeof RDServerModule

interface RenderToStreamArgs {
  ServerEntry: ServerEntryType
  FallbackDocument: React.FunctionComponent
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

const rscWebpackShims = `\
globalThis.__rw_module_cache__ ||= new Map();

globalThis.__webpack_chunk_load__ ||= (id) => {
  console.log('rscWebpackShims chunk load id', id)
  return import(id).then((m) => globalThis.__rw_module_cache__.set(id, m))
};

globalThis.__webpack_require__ ||= (id) => {
  console.log('rscWebpackShims require id', id)
  return globalThis.__rw_module_cache__.get(id)
};
`

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
          React.createElement(ServerEntry, {
            css: cssLinks,
            meta: metaTags,
          }),
        ),
      ),
    )
  }

  /**
   * These are the opts that inject the bundles, and Assets into html
   */
  const bootstrapOptions = {
    bootstrapScriptContent:
      // Only insert assetMap if client side JS will be loaded
      jsBundles.length > 0
        ? `window.__REDWOOD__ASSET_MAP = ${assetMap}; ${rscWebpackShims}`
        : undefined,
    bootstrapModules: jsBundles,
  }

  // We'll use `renderToReadableStream` to start the whole React rendering
  // process. This will internally initialize React and its hooks. It's
  // important that this initializes the same React instance that all client
  // modules (components) will later use when they render. Had we just imported
  // `react-dom/server.edge` normally we would have gotten an instance based on
  // react and react-dom in node_modules. All client components however uses a
  // bundled version of React (so that it can be sent to the browser for normal
  // browsing of the site). Importing it like this we make sure that SSR uses
  // that same bundled version of react and react-dom.
  const { renderToReadableStream }: RDServerType =
    await importModule('rd-server')

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

    let root: React.ReactElement = renderRoot(currentPathName)
    root = React.createElement(renderFromDist('AboutPage'))

    const reactStream: ReactDOMServerReadableStream =
      await renderToReadableStream(root, renderToStreamOptions)

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

export async function importModule(
  mod: 'rsdw-server' | 'rsdw-client' | 'rd-server',
) {
  const webPath = getPaths().web

  if (mod === 'rsdw-server') {
    return (await import(path.join(webPath.distRsc, 'rsdw-server.mjs'))).default
  } else if (mod === 'rsdw-client') {
    return (await import(path.join(webPath.distClient, 'rsdw-client.mjs')))
      .default
  } else if (mod === 'rd-server') {
    return (await import(path.join(webPath.distClient, 'rd-server.mjs')))
      .default
  }

  throw new Error('Unknown module ' + mod)
}
