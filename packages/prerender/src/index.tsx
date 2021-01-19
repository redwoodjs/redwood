import fs from 'fs'
import path from 'path'

import React from 'react'

import babelRequireHook from '@babel/register'
import prettier from 'prettier'
import ReactDOMServer from 'react-dom/server'

import { getConfig, getPaths } from '@redwoodjs/internal'
import { RedwoodProvider } from '@redwoodjs/web'

const INDEX_FILE = path.join(getPaths().web.dist, '/index.html')
const DEFAULT_INDEX = path.join(getPaths().web.dist, '/defaultIndex.html')

const rwWebPaths = getPaths().web

// Prerender specific configuration
// extends projects web/babelConfig
babelRequireHook({
  extends: path.join(rwWebPaths.base, '.babelrc.js'),
  extensions: ['.js', '.ts', '.tsx', '.jsx'],
  plugins: [
    ['inline-react-svg'],
    ['ignore-html-and-css-imports'], // webpack/postcss handles CSS imports
    [
      'babel-plugin-module-resolver',
      {
        alias: {
          src: rwWebPaths.src,
        },
      },
    ],
  ],
  only: [rwWebPaths.base],
  ignore: ['node_modules'],
  cache: false,
})

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
  dryRun: boolean
}

// WARN! is a stop-gap solution
// This will prevent SSR blowing up,
// remove this when all references to window from the codebase are removed
const registerShims = () => {
  global.__REDWOOD__API_PROXY_PATH = getConfig().web.apiProxyPath

  // @ts-expect-error-next-line
  global.__REDWOOD__USE_AUTH = () => ({
    loading: true, // This should 🤞🏽 just cause the whileLoading component to show up on Private routes
    isAuthenticated: false,
  })

  global.__REDWOOD_PRERENDER_MODE = true
}

export const runPrerender = async ({
  inputComponentPath,
  outputHtmlPath,
  dryRun,
}: PrerenderParams) => {
  registerShims()

  const indexContent = fs.readFileSync(getRootHtmlPath()).toString()

  const { default: ComponentToPrerender } = await import(inputComponentPath)
  const { default: Routes } = await import(getPaths().web.routes)

  try {
    const componentAsHtml = ReactDOMServer.renderToStaticMarkup(
      <>
        {/* Do this so that the @redwoodjs/router.routes object is populated */}
        <RedwoodProvider>
          <Routes />
          <ComponentToPrerender />
        </RedwoodProvider>
      </>
    )
    const renderOutput = indexContent.replace(
      '<server-markup/>',
      componentAsHtml
    )

    if (dryRun) {
      console.log('::: Dry run, not writing changes :::')
      console.log(`::: 🚀 Prerender output for ${inputComponentPath} ::: `)
      const prettyOutput = prettier.format(renderOutput, { parser: 'html' })
      console.log(prettyOutput)
      console.log('::: --- ::: ')

      return
    }

    if (outputHtmlPath) {
      // Copy default index.html to defaultIndex.html first, like react-snap
      if (outputHtmlPath === 'web/dist/index.html') {
        fs.copyFileSync(outputHtmlPath, 'web/dist/defaultIndex.html')
      }
      fs.writeFileSync(outputHtmlPath, renderOutput)
    }
  } catch (e) {
    console.log(`Failed to prerender ${inputComponentPath}`)
    console.error(e)
    return
  }
}
