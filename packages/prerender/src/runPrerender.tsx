import fs from 'fs'
import path from 'path'

import React from 'react'

import babelRequireHook from '@babel/register'
import prettier from 'prettier'
import ReactDOMServer from 'react-dom/server'

import { getPaths } from '@redwoodjs/internal'
import { RedwoodProvider } from '@redwoodjs/web'

import { getRootHtmlPath, registerShims, writeToDist } from './internal'

interface PrerenderParams {
  inputComponentPath: string // usually web/src/{components/pages}/*
  outputHtmlPath: string // web/dist/{path}.html
  dryRun: boolean
}

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

export const runPrerender = async ({
  inputComponentPath,
  outputHtmlPath,
  dryRun,
}: PrerenderParams) => {
  registerShims()

  const indexContent = fs.readFileSync(getRootHtmlPath()).toString()

  const { default: ComponentToPrerender } = await import(inputComponentPath)

  // @MARK
  // we render <Routes> to build the list of routes e.g. routes.home()
  // ideally in next version of Router, we can directly support SSR,
  // and won't require getting componentToPrerender
  const { default: Routes } = await import(getPaths().web.routes)
  const componentAsHtml = ReactDOMServer.renderToString(
    <>
      <RedwoodProvider>
        <Routes />
        <ComponentToPrerender />
      </RedwoodProvider>
    </>
  )
  const renderOutput = indexContent.replace(
    '<server-markup></server-markup>',
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
    // Copy default index.html to defaultIndex.html first
    // This is to prevent recursively rendering the home page
    if (outputHtmlPath === 'web/dist/index.html') {
      fs.copyFileSync(outputHtmlPath, 'web/dist/defaultIndex.html')
    }

    writeToDist(outputHtmlPath, renderOutput)
  }
}
