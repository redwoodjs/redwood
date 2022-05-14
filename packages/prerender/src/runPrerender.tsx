import fs from 'fs'
import path from 'path'

import React from 'react'

import cheerio from 'cheerio'
import { Kind } from 'graphql'
import ReactDOMServer from 'react-dom/server'

import { getPaths, registerWebSideBabelHook } from '@redwoodjs/internal'
import { LocationProvider } from '@redwoodjs/router'
import { getProject } from '@redwoodjs/structure'

import mediaImportsPlugin from './babelPlugins/babel-plugin-redwood-prerender-media-imports'
import { graphqlHandler } from './graphql/graphql'
import { getRootHtmlPath, registerShims, writeToDist } from './internal'

function getCellQueries() {
  const cellQueries = getProject(
    '/Users/tobbe/tmp/rw-pageloadingcontext/'
  ).cells.map((cell) => {
    const ast = cell.queryAst

    let vars

    if (!ast) {
      console.log('No ast for', cell)
    } else {
      for (const def of ast.definitions) {
        if (def.kind === Kind.OPERATION_DEFINITION) {
          vars = def.variableDefinitions
            ?.map((varDef) => {
              if (
                varDef.type.kind === Kind.NON_NULL_TYPE &&
                varDef.type.type.kind === Kind.NAMED_TYPE
              ) {
                return {
                  name: varDef.variable.name.value,
                  type: varDef.type.type.name.value,
                }
              } else {
                console.log('Unhandled varDef', varDef)
              }

              return undefined
            })
            ?.filter(Boolean)
        }
      }
    }

    return {
      path: cell.filePath,
      operationName: cell.queryOperationName,
      query: cell.queryString,
      vars,
    }
  })

  return cellQueries
}

async function getCellData() {
  const cellQueries = getCellQueries()

  const gqlHandler = await graphqlHandler()

  console.log('gqlHandler', gqlHandler)

  const cellData = await Promise.all(
    cellQueries.map(async (cellQuery) => {
      const operation = {
        operationName: cellQuery.operationName,
        query: cellQuery.query,
        variables: cellQuery.vars || {},
      }

      console.log('operation', operation)

      const handlerResult = await gqlHandler(operation)

      console.log('handlerResult', handlerResult)
    })
  )

  return cellData
}

interface PrerenderParams {
  routerPath: string // e.g. /about, /dashboard/me
}

export const runPrerender = async ({
  routerPath,
}: PrerenderParams): Promise<string | void> => {
  const cellData = await getCellData()
  console.log('cellData', cellData)

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

  registerShims(routerPath)

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
  // Copy default (unprerendered) index.html to 200.html first
  // This is to prevent recursively rendering the home page
  if (outputHtmlPath === 'web/dist/index.html') {
    const html200Path = path.join(getPaths().web.dist, '200.html')

    if (!fs.existsSync(html200Path)) {
      fs.copyFileSync(outputHtmlAbsPath, html200Path)
    }
  }

  writeToDist(outputHtmlAbsPath, content)
}
