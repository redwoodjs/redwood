import { Writable } from 'node:stream'
import path from 'path'

import React from 'react'

import { renderToPipeableStream, renderToString } from 'react-dom/server'

import { getPaths } from '@redwoodjs/project-config'
import type { TagDescriptor } from '@redwoodjs/web'
// @TODO (ESM), use exports field. Cannot import from web because of index exports
import {
  ServerHtmlProvider,
  ServerInjectedHtml,
} from '@redwoodjs/web/dist/components/ServerInject'

interface RenderToStreamArgs {
  ServerEntry: any
  currentPathName: string
  metaTags: TagDescriptor[]
  includeJs: boolean
  res: Writable
}

export function reactRenderToStream({
  ServerEntry,
  currentPathName,
  metaTags,
  includeJs,
  res,
}: RenderToStreamArgs) {
  const rwPaths = getPaths()

  const bootstrapModules = [
    path.join(__dirname, '../inject', 'reactRefresh.js'),
  ]

  if (includeJs) {
    // type casting: guaranteed to have entryClient by this stage, because checks run earlier
    bootstrapModules.push(rwPaths.web.entryClient as string)
  }

  // TODO (STREAMING) CSS is handled by Vite in dev mode, we don't need to
  // worry about it in dev but..... it causes a flash of unstyled content.
  // For now I'm just injecting index css here
  // Looks at collectStyles in packages/vite/src/fully-react/find-styles.ts
  const FIXME_HardcodedIndexCss = ['index.css']

  const assetMap = JSON.stringify({
    css: FIXME_HardcodedIndexCss,
    meta: metaTags,
  })

  const intermediateStream = createServerInjectionStream({
    outputStream: res,
    onFinal: () => {
      res.end()
    },
  })

  const { pipe } = renderToPipeableStream(
    React.createElement(
      ServerHtmlProvider,
      {},
      ServerEntry({
        url: currentPathName,
        css: FIXME_HardcodedIndexCss,
        meta: metaTags,
      })
    ),
    {
      bootstrapScriptContent: includeJs
        ? `window.__assetMap = function() { return ${assetMap} }`
        : undefined,
      bootstrapModules,
      onShellReady() {
        // Pass the react "input" stream to the injection stream
        // This intermediate stream will interweave the injected html into the react stream's <head>
        pipe(intermediateStream)
      },
    }
  )
}
function createServerInjectionStream({
  outputStream,
  onFinal,
}: {
  outputStream: Writable
  onFinal: () => void
}) {
  return new Writable({
    write(chunk, encoding, next) {
      const chunkAsString = chunk.toString()
      const split = chunkAsString.split('</head>')

      // If the closing tag exists
      if (split.length > 1) {
        const [beforeClosingHead, afterClosingHead] = split

        const elementsInjectedToHead = renderToString(
          React.createElement(ServerInjectedHtml)
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
      onFinal()
    },
  })
}
