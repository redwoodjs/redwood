import path from 'node:path'
import { Writable } from 'node:stream'

import React from 'react'

import { renderToPipeableStream, renderToString } from 'react-dom/server'

import type { TagDescriptor } from '@redwoodjs/web'
// @TODO (ESM), use exports field. Cannot import from web because of index exports
import {
  ServerHtmlProvider,
  ServerInjectedHtml,
  createInjector,
  RenderCallback,
} from '@redwoodjs/web/dist/components/ServerInject'

interface RenderToStreamArgs {
  ServerEntry: any
  currentPathName: string
  metaTags: TagDescriptor[]
  cssLinks: string[]
  isProd: boolean
  jsBundles?: string[]
  res: Writable
}

interface StreamOptions {
  waitForAllReady?: boolean
}

export function reactRenderToStream(
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
    res,
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

  // This is effectively a transformer stream
  const intermediateStream = createServerInjectionStream({
    outputStream: res,
    injectionState,
  })

  const { pipe } = renderToPipeableStream(
    React.createElement(
      ServerHtmlProvider,
      {
        value: injectToPage,
      },
      ServerEntry({
        url: currentPathName,
        css: cssLinks,
        meta: metaTags,
      })
    ),
    {
      bootstrapScriptContent:
        // Only insert assetMap if clientside JS will be loaded
        jsBundles.length > 0
          ? `window.__REDWOOD__ASSET_MAP = ${assetMap}`
          : undefined,
      bootstrapModules: jsBundles,
      onShellReady() {
        // Pass the react "input" stream to the injection stream
        // This intermediate stream will interweave the injected html into the react stream's <head>

        if (!waitForAllReady) {
          pipe(intermediateStream)
        }
      },
      onAllReady() {
        if (waitForAllReady) {
          pipe(intermediateStream)
        }
      },
    }
  )
}

function createServerInjectionStream({
  outputStream,
  injectionState,
}: {
  outputStream: Writable
  injectionState: Set<RenderCallback>
}) {
  return new Writable({
    write(chunk, encoding, next) {
      const chunkAsString = chunk.toString()
      const split = chunkAsString.split('</head>')

      // If the closing tag exists
      if (split.length > 1) {
        const [beforeClosingHead, afterClosingHead] = split

        const elementsInjectedToHead = renderToString(
          React.createElement(ServerInjectedHtml, {
            injectionState,
          })
        )

        const outputBuffer = Buffer.from(
          [
            beforeClosingHead,
            elementsInjectedToHead,
            '</head>',
            afterClosingHead,
          ].join('')
        )

        outputStream.write(outputBuffer, encoding)
      } else {
        outputStream.write(chunk, encoding)
      }

      next()
    },
    final() {
      // Before finishing, make sure we flush anything else that has been added to the queue
      // Because of the implementation in ServerRenderHtml, its safe to call this multiple times (I think!)
      // This is really for the data fetching usecase, where the promise is resolved after <head> is closed
      const elementsAtTheEnd = renderToString(
        React.createElement(ServerInjectedHtml, {
          injectionState,
        })
      )

      outputStream.write(elementsAtTheEnd)

      // This will find all the elements added by PortalHead during a server render, and move them into <head>
      // @TODO remove the whitespace to save them bytes later
      outputStream.write(`<script>document.querySelectorAll('body [data-rwjs-head]').forEach((el) => {
        document.querySelectorAll('head ' + el.tagName).forEach((e) => {
          if (
            el.tagName === 'TITLE' ||
            (el.tagName === 'META' &&
              el.getAttribute('name') === e.getAttribute('name') &&
              el.getAttribute('property') === e.getAttribute('property'))
          ) {
            e.remove();
          }
          document.head.appendChild(el);
        });
      });
        </script>`)

      outputStream.end()
    },
  })
}
