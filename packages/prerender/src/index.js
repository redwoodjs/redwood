// @ts-check
import fs from 'fs'

import React from 'react'

import ReactDOMServer from 'react-dom/server'

import { getPaths } from '@redwoodjs/internal'

const INDEX_FILE = `${getPaths().web.dist}/index.html`

export const runPrerender = async ({ inputComponentPath, outputHtmlPath }) => {
  globalThis.window = {
    ssr: true,
  }

  // @TODO do we need to use path.join?
  const indexContent = fs.readFileSync(INDEX_FILE).toString()

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
