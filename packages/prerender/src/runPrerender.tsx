import fs from 'fs'
import path from 'path'

import React from 'react'

import cheerio from 'cheerio'
import ReactDOMServer from 'react-dom/server'

import { getPaths, registerWebSideBabelHook } from '@redwoodjs/internal'
import { LocationProvider } from '@redwoodjs/router'

import mediaImportsPlugin from './babelPlugins/babel-plugin-redwood-prerender-media-imports'
import { getRootHtmlPath, registerShims, writeToDist } from './internal'

interface PrerenderParams {
  routerPath: string // e.g. /about, /dashboard/me
}

export const runPrerender = async ({
  routerPath,
}: PrerenderParams): Promise<string | void> => {
  // Prerender specific configuration
  // extends projects web/babelConfig
  registerWebSideBabelHook({
    overrides: [
      {
        plugins: [
          ['ignore-html-and-css-imports'], // webpack/postcss handles CSS imports
          [mediaImportsPlugin],
        ],
      },
    ],
  })

  registerShims()

  const indexContent = fs.readFileSync(getRootHtmlPath()).toString()
  const { default: App } = await import(getPaths().web.app)

  const componentAsHtml = ReactDOMServer.renderToString(
    <LocationProvider
      location={{
        pathname: routerPath,
      }}
    >
      <App />
    </LocationProvider>
  )

  const { helmet } = global.__REDWOOD__HELMET_CONTEXT

  const indexHtmlTree = cheerio.load(indexContent)

  if (helmet) {
    const helmetElements = `
  ${helmet?.link.toString()}
  ${helmet?.meta.toString()}
  ${helmet?.script.toString()}
  ${helmet?.noscript.toString()}
  `

    // Add all head elements
    indexHtmlTree('head').prepend(helmetElements)

    // Only change the title, if its not empty
    if (cheerio.load(helmet?.title.toString())('title').text() !== '') {
      indexHtmlTree('title').replaceWith(helmet?.title.toString())
    }
  }

  // This is set by webpack by the html plugin
  indexHtmlTree('server-markup').replaceWith(componentAsHtml)

  const renderOutput = indexHtmlTree.html()

  return renderOutput
}

// Used by cli at build time
export const writePrerenderedHtmlFile = (
  outputHtmlPath: string,
  content: string
) => {
  const outputHtmlAbsPath = path.join(getPaths().base, outputHtmlPath)
  // Copy default index.html to 200.html first
  // This is to prevent recursively rendering the home page
  if (outputHtmlPath === 'web/dist/index.html') {
    fs.copyFileSync(
      outputHtmlAbsPath,
      path.join(getPaths().base, 'web/dist/200.html')
    )
  }

  writeToDist(outputHtmlAbsPath, content)
}
