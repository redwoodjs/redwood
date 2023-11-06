import path from 'node:path'

import React from 'react'

import type {
  RenderToReadableStreamOptions,
  ReactDOMServerReadableStream,
} from 'react-dom/server'

import { LocationProvider } from '@redwoodjs/router'
import type { TagDescriptor } from '@redwoodjs/web'
// @TODO (ESM), use exports field. Cannot import from web because of index exports
import {
  ServerHtmlProvider,
  createInjector,
} from '@redwoodjs/web/dist/components/ServerInject'

import { createBufferedTransformStream } from './transforms/bufferedTransform'
import { createTimeoutTransform } from './transforms/cancelTimeoutTransform'
import { createServerInjectionTransform } from './transforms/serverInjectionTransform'

interface RenderToStreamArgs {
  ServerEntry: any
  FallbackDocument: any
  currentPathName: string
  metaTags: TagDescriptor[]
  cssLinks: string[]
  isProd: boolean
  jsBundles?: string[]
}

interface StreamOptions {
  waitForAllReady?: boolean
  onError?: (err: Error) => void
}

export async function reactRenderToStreamResponse(
  renderOptions: RenderToStreamArgs,
  streamOptions: StreamOptions
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
  })

  // Timeout after 10 seconds
  // @TODO make this configurable
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => {
    controller.abort()
  }, 10000)

  const timeoutTransform = createTimeoutTransform(timeoutHandle)

  // @ts-expect-error Something in React's packages mean types dont come through
  // Possible that we need to upgrade the @types/* packages
  const { renderToReadableStream } = await import('react-dom/server.edge')

  const renderRoot = (path: string) => {
    return React.createElement(
      ServerHtmlProvider,
      {
        value: injectToPage,
      },
      React.createElement(
        LocationProvider,
        {
          location: {
            pathname: path,
          },
        },
        ServerEntry({
          url: path,
          css: cssLinks,
          meta: metaTags,
        })
      )
    )
  }

  /**
   * These are the opts that inject the bundles, and Assets into html
   */
  const bootstrapOptions = {
    bootstrapScriptContent:
      // Only insert assetMap if clientside JS will be loaded
      jsBundles.length > 0
        ? `window.__REDWOOD__ASSET_MAP = ${assetMap}`
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

    const reactStream: ReactDOMServerReadableStream =
      await renderToReadableStream(
        renderRoot(currentPathName),
        renderToStreamOptions
      )

    const output = reactStream
      .pipeThrough(bufferTransform)
      .pipeThrough(serverInjectionTransform)
      .pipeThrough(timeoutTransform)

    if (waitForAllReady) {
      await reactStream.allReady
    }

    return new Response(output, {
      status: didErrorOutsideShell ? 500 : 200, // I think better right? Prevents caching a bad page
      headers: { 'content-type': 'text/html' },
    })
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
      bootstrapOptions
    )

    return new Response(fallbackShell, {
      status: 500,
      headers: { 'content-type': 'text/html' },
    })
  }
}
