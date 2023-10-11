import path from 'node:path'

import React from 'react'

import type { TagDescriptor } from '@redwoodjs/web'
// @TODO (ESM), use exports field. Cannot import from web because of index exports
import {
  ServerHtmlProvider,
  createInjector,
} from '@redwoodjs/web/dist/components/ServerInject'

import { createBufferedTransformStream } from './transforms/bufferedTransform'
import { createServerInjectionTransform } from './transforms/serverInjectionTransform'

interface RenderToStreamArgs {
  ServerEntry: any
  currentPathName: string
  metaTags: TagDescriptor[]
  cssLinks: string[]
  isProd: boolean
  jsBundles?: string[]
}

interface StreamOptions {
  waitForAllReady?: boolean
}

export async function reactRenderToStreamResponse(
  renderOptions: RenderToStreamArgs,
  streamOptions: StreamOptions
) {
  const { waitForAllReady = false } = streamOptions
  const {
    ServerEntry,
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
  const bufferedTransformStream = createBufferedTransformStream()

  // This is a transformer stream, that will inject all things called with useServerInsertedHtml
  const serverInjectionTransformer = createServerInjectionTransform({
    injectionState,
  })

  // @ts-expect-error Something in React's packages mean types dont come through
  // Possible that we need to upgrade the @types/* packages
  const { renderToReadableStream } = await import('react-dom/server.edge')

  const root = React.createElement(
    ServerHtmlProvider,
    {
      value: injectToPage,
    },
    ServerEntry({
      url: currentPathName,
      css: cssLinks,
      meta: metaTags,
    })
  )

  try {
    const reactStream = await renderToReadableStream(root, {
      bootstrapScriptContent:
        // Only insert assetMap if clientside JS will be loaded
        jsBundles.length > 0
          ? `window.__REDWOOD__ASSET_MAP = ${assetMap}`
          : undefined,
      bootstrapModules: jsBundles,
      onError: (err: any) => {
        // @TODO status code
        // @TODO error handling
        console.error('🔻 Failed to render in onErr block')
        console.error(err)
      },
    })

    const output = reactStream
      .pipeThrough(bufferedTransformStream)
      .pipeThrough(serverInjectionTransformer)

    if (waitForAllReady) {
      await reactStream.allReady
    }

    // @TODO status code
    // @TODO error handling
    return new Response(output, {
      headers: { 'content-type': 'text/html' },
    })
  } catch (e) {
    console.error('🔻 Failed to render')
    console.error(e)

    return new Response('Failed to render', {
      status: 500,
    })
  }
}
