import fs from 'fs'
import path from 'path'

import express from 'express'
import { createServer as createViteServer } from 'vite'

// import {getPaths} from

globalThis.RWJS_GLOBALS = {}
// TEMP!!!
process.env.RWJS_VITE_SSR_TEMP = true

async function createServer() {
  const app = express()

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    configFile: './vite.config.ts',
    server: { middlewareMode: 'ssr' },
    appType: 'custom',
  })

  // use vite's connect instance as middleware
  // if you use your own express router (express.Router()), you should use router.use
  app.use(vite.middlewares)

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl

    // 1. Read index.html
    let template = fs.readFileSync(
      path.resolve(__dirname, '../web/index.html'),
      'utf-8'
    )

    // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
    //    also applies HTML transforms from Vite plugins, e.g. global preambles
    //    from @vitejs/plugin-react
    try {
      template = await vite.transformIndexHtml(url, template)

      // @MARK: using virtual modules here, so we can actually find the chunk we need! 🤯
      const { default: routes } = await vite.ssrLoadModule(
        'virtual:redwood-routes'
      )

      const route = routes.find((route) => route.path === url)

      let routeContext = {}
      if (route.renderDataPath) {
        try {
          const renderHooks = await vite.ssrLoadModule(route.renderDataPath)
          console.log(
            `🗯 \n ~ file: server.js ~ line 49 ~ renderHooks`,
            renderHooks
          )

          // @MARK need to agree on what the parameters are for the renderHooks
          const renderData = await renderHooks.serverData(req)

          routeContext = {
            ...renderData,
          }
        } catch (e) {
          console.error(e)
        }
      }

      // 3. Load the server entry. vite.ssrLoadModule automatically transforms
      //    your ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation similar to HMR.
      const { render } = await vite.ssrLoadModule('/src/entry-server.tsx')

      // MARK: use renderData file to load SSR props

      // 4. render the app HTML. This assumes entry-server.js's exported `render`
      //    function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      const appHtml = await render(routeContext, url)

      // 5. Inject the app-rendered HTML into the template.
      let html = template.replace(`<!-- element -->`, appHtml)

      // @MARK: we can inject the bundle here, if we don't already have it in index.html
      if (
        !html.includes('type="module" src="src/index.js"') &&
        html.includes('<!-- inject -->')
      ) {
        html = html.replace(
          '<!-- inject -->',
          '<script type="module" src="src/index.js"></script>'
        )
      }
      // 6. Send the rendered HTML back.
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      // send back a SPA page
      // res.status(200).set({ 'Content-Type': 'text/html' }).end(template)

      // If an error is caught, let Vite fix the stack trace so it maps back to
      // your actual source code.
      vite.ssrFixStacktrace(e)
      next(e)
    }
  })

  app.listen(5173)
  console.log('Started server on 5173')
}

createServer()
