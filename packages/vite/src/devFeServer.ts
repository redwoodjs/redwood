// TODO (STREAMING) Merge with runFeServer so we only have one file

import { createElement } from 'react'

import type { Request, Response } from 'express'
import express from 'express'
import { chromium } from 'playwright'
import { renderToString } from 'react-dom/server'
import { createServer as createViteServer } from 'vite'

import { getProjectRoutes } from '@redwoodjs/internal/dist/routes'
import { getConfig, getPaths } from '@redwoodjs/project-config'

import { createReactStreamingHandler } from './streaming/createReactStreamingHandler'
import { registerFwGlobals } from './streaming/registerGlobals'
import { ensureProcessDirWeb } from './utils'

// TODO (STREAMING) Just so it doesn't error out. Not sure how to handle this.
globalThis.__REDWOOD__PRERENDER_PAGES = {}

async function createServer() {
  ensureProcessDirWeb()

  registerFwGlobals()

  const app = express()
  const rwPaths = getPaths()

  // ~~~ Dev time validations ~~~~
  // TODO (STREAMING) When Streaming is released Vite will be the only bundler,
  // and this file should always exist. So the error message needs to change
  // (or be removed perhaps)
  if (!rwPaths.web.entryServer || !rwPaths.web.entryClient) {
    throw new Error(
      'Vite entry points not found. Please check that your project has ' +
        'an entry.client.{jsx,tsx} and entry.server.{jsx,tsx} file in ' +
        'the web/src directory.'
    )
  }

  if (!rwPaths.web.viteConfig) {
    throw new Error(
      'Vite config not found. You need to setup your project with Vite using `yarn rw setup vite`'
    )
  }
  // ~~~~ Dev time validations ~~~~

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    configFile: rwPaths.web.viteConfig,
    server: { middlewareMode: true },
    logLevel: 'info',
    clearScreen: false,
    appType: 'custom',
  })

  // use vite's connect instance as middleware
  app.use(vite.middlewares)

  const routes = getProjectRoutes()

  // TODO (STREAMING) CSS is handled by Vite in dev mode, we don't need to
  // worry about it in dev but..... it causes a flash of unstyled content.
  // For now I'm just injecting index css here
  // Look at collectStyles in packages/vite/src/fully-react/find-styles.ts
  const FIXME_HardcodedIndexCss = ['index.css']

  for (const route of routes) {
    const routeHandler = await createReactStreamingHandler(
      {
        route,
        clientEntryPath: rwPaths.web.entryClient as string,
        cssLinks: FIXME_HardcodedIndexCss,
      },
      vite
    )

    // @TODO if it is a 404, hand over to 404 handler
    if (!route.matchRegexString) {
      continue
    }

    const expressPathDef = route.hasParams
      ? route.matchRegexString
      : route.pathDefinition

    app.get(expressPathDef, routeHandler)
    app.get(
      createPngRouteDef(expressPathDef),
      async (req: Request, res: Response) => {
        // @TODO: Params should take height and width here.
        // const { params } = req

        const browser = await chromium.launch()
        const context = await browser.newContext()
        const page = await context.newPage()

        const ogImgThing = route.relativeFilePath!.replace(
          /\.([jt]sx)/,
          '.ogImg.$1'
        )

        const { DATA, output: OgComponent } = await vite.ssrLoadModule(
          ogImgThing
        )

        const { default: AppComponent } = await vite.ssrLoadModule(
          rwPaths.web.app
        )

        const { Document: DocumentComponent } = await vite.ssrLoadModule(
          rwPaths.web.document
        )

        const dataOut = await DATA(req.params)

        if (typeof process.env.RWJS_WEB_HOST !== 'string') {
          throw new Error(
            'Set the RWJS_WEB_HOST env, Rob. Has to be an absolute url!!'
          )
        }

        const htmlOutput = renderToString(
          createElement(
            DocumentComponent,
            {
              // @TODO hardcoded index.css
              css: [`${process.env.RWJS_WEB_HOST}/index.css`],
              meta: [],
            },
            createElement(
              AppComponent,
              {},
              createElement(OgComponent, {
                data: dataOut,
              })
            )
          )
        )

        await page.setContent(htmlOutput)

        const png = await page.screenshot({ type: 'png' })

        await browser.close()

        res.setHeader('Content-Type', 'image/png')
        res.end(png)
      }
    )
  }

  const port = getConfig().web.port
  console.log(`Started server on http://localhost:${port}`)
  return await app.listen(port)
}

let devApp = createServer()

process.stdin.on('data', async (data) => {
  const str = data.toString().trim().toLowerCase()
  if (str === 'rs' || str === 'restart') {
    console.log('Restarting dev web server.....')
    ;(await devApp).close(() => {
      devApp = createServer()
    })
  }
})

function createPngRouteDef(expressPathDef: string): any {
  if (expressPathDef.endsWith('$')) {
    return expressPathDef.replace('$', '.png$')
  } else {
    return expressPathDef + '.png'
  }
}
