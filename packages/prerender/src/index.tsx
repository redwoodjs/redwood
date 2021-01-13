// @ts-check
import fs from 'fs'

import React from 'react'

import ReactDOMServer from 'react-dom/server'

import { getPaths } from '@redwoodjs/internal'

// @TODO do we need to use path.join?
const INDEX_FILE = `${getPaths().web.dist}/index.html`
const DEFAULT_INDEX = `${getPaths().web.dist}/defaultIndex.html`

const getRootHtmlPath = () => {
  if (fs.existsSync(DEFAULT_INDEX)) {
    return DEFAULT_INDEX
  } else {
    return INDEX_FILE
  }
}

interface PrerenderParams {
  inputComponentPath: string // usually web/src/{components/pages}/*
  outputHtmlPath: string // web/dist/{path}.html
}

export const runPrerender = async ({
  inputComponentPath,
  outputHtmlPath,
}: PrerenderParams) => {
  if (!globalThis.window) {
    // @ts-expect-error-next-line
    globalThis.window = {}
  }

  const indexContent = fs.readFileSync(getRootHtmlPath()).toString()

  const { default: ComponentToPrerender } = await import(inputComponentPath)

  const componentAsHtml = ReactDOMServer.renderToStaticMarkup(
    <ComponentToPrerender />
  )

  const renderOutput = indexContent.replace('<server-markup/>', componentAsHtml)

  if (outputHtmlPath) {
    // Copy default index.html to defaultIndex.html first, like react-snap
    if (outputHtmlPath === 'web/dist/index.html') {
      fs.copyFileSync(outputHtmlPath, 'web/dist/defaultIndex.html')
    }
    fs.writeFileSync(outputHtmlPath, renderOutput)
  }
}
