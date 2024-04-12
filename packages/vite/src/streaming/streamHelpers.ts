import path from 'node:path'

import React from 'react'

import type {
  RenderToReadableStreamOptions,
  ReactDOMServerReadableStream,
} from 'react-dom/server'
import { renderToReadableStream } from 'react-dom/server.edge'

import type { ServerAuthState } from '@redwoodjs/auth'
import { ServerAuthProvider } from '@redwoodjs/auth'
import { LocationProvider } from '@redwoodjs/router'
import type { TagDescriptor } from '@redwoodjs/web'
// @TODO (ESM), use exports field. Cannot import from web because of index exports
import {
  ServerHtmlProvider,
  createInjector,
} from '@redwoodjs/web/dist/components/ServerInject'

import type { MiddlewareResponse } from '../middleware/MiddlewareResponse.js'
import type { ServerEntryType } from '../types.js'

import { createBufferedTransformStream } from './transforms/bufferedTransform.js'
import { createTimeoutTransform } from './transforms/cancelTimeoutTransform.js'
import { createServerInjectionTransform } from './transforms/serverInjectionTransform.js'

interface RenderToStreamArgs {
  ServerEntry: ServerEntryType
  FallbackDocument: React.FunctionComponent
  currentUrl: URL
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
    currentUrl,
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

  const renderRoot = (url: URL) => {
    return React.createElement(
      ServerAuthProvider,
      {
        value: authState,
      },
      React.createElement(
        LocationProvider,
        {
          location: url,
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

    const root = renderRoot(currentUrl)

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
