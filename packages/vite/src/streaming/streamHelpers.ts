import path from 'node:path'

import type React from 'react'

import type {
  RenderToReadableStreamOptions,
  ReactDOMServerReadableStream,
} from 'react-dom/server'
import type { default as RDServerModule } from 'react-dom/server.edge'

import type { ServerAuthState } from '@redwoodjs/auth/dist/AuthProvider/ServerAuthProvider.js'
import { getConfig, getPaths } from '@redwoodjs/project-config'
import type { TagDescriptor } from '@redwoodjs/web'
// @TODO (ESM), use exports field. Cannot import from web because of index exports
import type * as ServerInjectModule from '@redwoodjs/web/dist/components/ServerInject'

import type { MiddlewareResponse } from '../middleware/MiddlewareResponse.js'
import type { ServerEntryType } from '../types.js'
import { makeFilePath } from '../utils.js'

import { createBufferedTransformStream } from './transforms/bufferedTransform.js'
import { createTimeoutTransform } from './transforms/cancelTimeoutTransform.js'
import { createServerInjectionTransform } from './transforms/serverInjectionTransform.js'

type RDServerType = typeof RDServerModule
type ServerInjectType = typeof ServerInjectModule

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
  return import(id).then((mod) => {
    console.log('rscWebpackShims chunk load mod', mod)

    // checking mod.default to better support CJS. If it's an object, it's
    // likely a CJS module. Otherwise it's probably an ES module with a
    // default export
    if (mod.default && typeof mod.default === 'object') {
      return globalThis.__rw_module_cache__.set(id, mod.default)
    }

    return globalThis.__rw_module_cache__.set(id, mod)
  })
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

  const { createElement }: React = await importModule('__rwjs__react')
  const {
    createInjector,
    ServerHtmlProvider,
    ServerInjectedHtml,
  }: ServerInjectType = await importModule('__rwjs__server_inject')
  const { renderToString }: RDServerType = await importModule('rd-server')

  // This ensures an isolated state for each request
  const { injectionState, injectToPage } = createInjector()

  // This makes it safe for us to inject at any point in the stream
  const bufferTransform = createBufferedTransformStream()

  // This is a transformer stream, that will inject all things called with useServerInsertedHtml
  const serverInjectionTransform = createServerInjectionTransform({
    injectionState,
    createElement,
    ServerInjectedHtml,
    renderToString,
    onlyOnFlush: waitForAllReady,
  })

  // Timeout after 10 seconds
  // @TODO make this configurable
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => {
    controller.abort()
  }, 10000)

  const timeoutTransform = createTimeoutTransform(timeoutHandle)

  const { LocationProvider }: any = await importModule('__rwjs__location')
  const { ServerAuthProvider }: any = await importModule(
    '__rwjs__server_auth_provider',
  )

  const renderRoot = (url: URL) => {
    console.log('streamHelpers.ts renderRoot url', url)
    return createElement('div', null, 'Hello World')
  }

  const renderRoot2 = (url: URL) => {
    console.log('streamHelpers.ts renderRoot url', url)
    return createElement(ServerEntry, {
      css: cssLinks,
      meta: metaTags,
    })
  }

  const renderRoot3 = (url: URL) => {
    console.log('streamHelpers.ts renderRoot url', url)
    return createElement(
      ServerAuthProvider,
      {
        value: authState,
      },
      createElement(
        LocationProvider,
        {
          location: url,
        },
        createElement(
          ServerHtmlProvider,
          {
            value: injectToPage,
          },
          createElement(ServerEntry, {
            css: cssLinks,
            meta: metaTags,
          }),
        ),
      ),
    )
  }

  if (Math.random() > 5) {
    console.log('renderRoot2', renderRoot2)
    console.log('renderRoot3', renderRoot3)
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

  const rscEnabled = getConfig().experimental?.rsc?.enabled

  // We'll use `renderToReadableStream` to start the whole React rendering
  // process. This will internally initialize React and its hooks. It's
  // important that this initializes the same React instance that all client
  // modules (components) will later use when they render. Had we just imported
  // `react-dom/server.edge` normally we would have gotten an instance based on
  // react and react-dom in node_modules. All client components however uses a
  // bundled version of React (so that it can be sent to the browser for normal
  // browsing of the site). Importing it like this we make sure that SSR uses
  // that same bundled version of react and react-dom.
  // TODO (RSC): Always import using importModule when RSC is on by default
  const { renderToReadableStream }: RDServerType = rscEnabled
    ? await importModule('rd-server')
    : await import('react-dom/server.edge')

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

    const root: React.ReactNode = renderRoot(currentUrl)

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

// We have to do this to ensure we're only using one version of the library
// we're importing, and one that's built with the right conditions. rsdw will
// import React, so it's important that it imports the same version of React as
// we are. If we're pulling rsdw from node_modules (which we would if we didn't
// get it from the dist folder) we'd also get the node_modules version of
// React. But the app itself already uses the bundled version of React, so we
// can't do that, because then we'd have to different Reacts where one isn't
// initialized properly
export async function importModule(
  mod:
    | 'rsdw-client'
    | 'rd-server'
    | '__rwjs__react'
    | '__rwjs__location'
    | '__rwjs__server_auth_provider'
    | '__rwjs__server_inject',
) {
  const distServer = getPaths().web.distServer
  const rsdwClientPath = makeFilePath(path.join(distServer, 'rsdw-client.mjs'))
  const rdServerPath = makeFilePath(path.join(distServer, 'rd-server.mjs'))
  const reactPath = makeFilePath(path.join(distServer, '__rwjs__react.mjs'))
  const locationPath = makeFilePath(
    path.join(distServer, '__rwjs__location.mjs'),
  )
  const ServerAuthProviderPath = makeFilePath(
    path.join(distServer, '__rwjs__server_auth_provider.mjs'),
  )
  const ServerInjectPath = makeFilePath(
    path.join(distServer, '__rwjs__server_inject.mjs'),
  )

  if (mod === 'rsdw-client') {
    return (await import(rsdwClientPath)).default
  } else if (mod === 'rd-server') {
    return (await import(rdServerPath)).default
  } else if (mod === '__rwjs__react') {
    return (await import(reactPath)).default
  } else if (mod === '__rwjs__location') {
    return (await import(locationPath)).default
  } else if (mod === '__rwjs__server_auth_provider') {
    return await import(ServerAuthProviderPath)
  } else if (mod === '__rwjs__server_inject') {
    return (await import(ServerInjectPath)).default
  }

  throw new Error('Unknown module ' + mod)
}
