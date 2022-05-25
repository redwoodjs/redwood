import fs from 'fs'
import path from 'path'

import React from 'react'

import cheerio from 'cheerio'
import { DocumentNode } from 'graphql'
import ReactDOMServer from 'react-dom/server'

import {
  getPaths,
  registerApiSideBabelHook,
  registerWebSideBabelHook,
} from '@redwoodjs/internal'
import { LocationProvider } from '@redwoodjs/router'
import { CellCacheContextProvider, QueryInfo } from '@redwoodjs/web'

import mediaImportsPlugin from './babelPlugins/babel-plugin-redwood-prerender-media-imports'
import { graphqlHandler } from './graphql/graphql'
import { getRootHtmlPath, registerShims, writeToDist } from './internal'

async function executeQuery(
  query: DocumentNode,
  variables?: Record<string, unknown>
) {
  const gqlHandler = await graphqlHandler()

  let operationName = ''
  for (const definition of query.definitions) {
    if (definition.kind === 'OperationDefinition' && definition.name?.value) {
      operationName = definition.name.value
    }
  }

  const operation = {
    operationName: operationName,
    query,
    variables,
  }

  const handlerResult = await gqlHandler(operation)

  return handlerResult.body
}

interface PrerenderParams {
  renderPath: string // The path (url) to render e.g. /about, /dashboard/me, /blog-post/3
  routePath: string // The path from a <Route> e.g. /blog-post/{id:Int}
}

export const runPrerender = async ({
  renderPath,
  routePath,
}: PrerenderParams): Promise<string | void> => {
  registerApiSideBabelHook({
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            api: getPaths().api.base,
            web: getPaths().web.base,
          },
          loglevel: 'silent', // to silence the unnecessary warnings
        },
      ],
    ],
    overrides: [
      {
        test: ['./api/'],
        plugins: [
          [
            'babel-plugin-module-resolver',
            {
              alias: {
                src: getPaths().api.src,
              },
              loglevel: 'silent',
            },
            'exec-api-src-module-resolver',
          ],
        ],
      },
      // {
      //   test: ['./web/'],
      //   plugins: [
      //     ...webPlugins,
      //     [
      //       'babel-plugin-module-resolver',
      //       {
      //         alias: {
      //           src: getPaths().web.src,
      //         },
      //         loglevel: 'silent',
      //       },
      //       'exec-web-src-module-resolver',
      //     ],
      //   ],
      //   ...otherWebConfig,
      // },
    ],
  })

  console.log('')
  console.log('prerender renderPath', renderPath)
  console.log('prerender routePath', routePath)
  console.log('')

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

  registerShims(renderPath)

  const indexContent = fs.readFileSync(getRootHtmlPath()).toString()
  const { default: App } = await import(getPaths().web.app)

  // TODO: Create this further up. We can potentially reuse some data between
  // different pages. I.e. if the same query, with the same variables is
  // executed twice, we'd only have to execute it once and then just reuse
  // the cached result the second time.
  const queryInfo: Record<string, QueryInfo> = {}

  // Render once to collect all queries
  ReactDOMServer.renderToString(
    <LocationProvider location={{ pathname: renderPath }}>
      <CellCacheContextProvider queryInfo={queryInfo}>
        <App />
      </CellCacheContextProvider>
    </LocationProvider>
  )

  console.log('')
  console.log('queryInfo', Object.values(queryInfo))
  console.log('')

  await Promise.all(
    Object.entries(queryInfo).map(async ([cacheKey, value]) => {
      console.log('cacheKey', cacheKey)
      console.log('value', value)

      const data = await executeQuery(value.query, value.variables)

      console.log('typeof data', typeof data)

      console.log('data', JSON.parse(data))

      queryInfo[cacheKey] = {
        ...value,
        data: JSON.parse(data).data,
        hasFetched: true,
      }

      return data
    })
  )

  const componentAsHtml = ReactDOMServer.renderToString(
    <LocationProvider location={{ pathname: renderPath }}>
      <CellCacheContextProvider queryInfo={queryInfo}>
        <App />
      </CellCacheContextProvider>
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
