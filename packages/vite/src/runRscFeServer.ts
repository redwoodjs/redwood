// TODO (STREAMING) Move this to a new package called @redwoodjs/fe-server (goes
// well in naming with @redwoodjs/api-server)
// Only things used during dev can be in @redwoodjs/vite. Everything else has
// to go in fe-server

import fs from 'fs/promises'
import path from 'path'

// @ts-expect-error We will remove dotenv-defaults from this package anyway
import { config as loadDotEnv } from 'dotenv-defaults'
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import isbot from 'isbot'
import type { Manifest as ViteBuildManifest } from 'vite'

import { getConfig, getPaths } from '@redwoodjs/project-config'

import { registerFwGlobals } from './streaming/registerGlobals'
import { renderRSC, setClientEntries } from './waku-lib/rsc-handler-worker'

/**
 * TODO (STREAMING)
 * We have this server in the vite package only temporarily.
 * We will need to decide where to put it, so that rwjs/internal and other heavy dependencies
 * can be removed from the final docker image
 */

// --- @MARK This should be removed once we have re-architected the rw serve command ---
// We need the dotenv, so that prisma knows the DATABASE env var
// Normally the RW cli loads this for us, but we expect this file to be run directly
// without using the CLI. Remember to remove dotenv-defaults dependency from this package
loadDotEnv({
  path: path.join(getPaths().base, '.env'),
  defaults: path.join(getPaths().base, '.env.defaults'),
  multiline: true,
})
//------------------------------------------------

const checkUaForSeoCrawler = isbot.spawn()
checkUaForSeoCrawler.exclude(['chrome-lighthouse'])

export async function runFeServer() {
  const app = express()
  const rwPaths = getPaths()
  const rwConfig = getConfig()

  registerFwGlobals()

  await setClientEntries('load')

  // TODO When https://github.com/tc39/proposal-import-attributes and
  // https://github.com/microsoft/TypeScript/issues/53656 have both landed we
  // should try to do this instead:
  // const routeManifest: RWRouteManifest = await import(
  //   rwPaths.web.routeManifest, { with: { type: 'json' } }
  // )
  // NOTES:
  //  * There's a related babel plugin here
  //    https://babeljs.io/docs/babel-plugin-syntax-import-attributes
  //     * Included in `preset-env` if you set `shippedProposals: true`
  //  * We had this before, but with `assert` instead of `with`. We really
  //    should be using `with`. See motivation in issues linked above.
  //  * With `assert` and `@babel/plugin-syntax-import-assertions` the
  //    code compiled and ran properly, but Jest tests failed, complaining
  //    about the syntax.
  // const routeManifestStr = await fs.readFile(rwPaths.web.routeManifest, 'utf-8')
  // const routeManifest: RWRouteManifest = JSON.parse(routeManifestStr)

  // TODO See above about using `import { with: { type: 'json' } }` instead
  const manifestPath = path.join(
    getPaths().web.dist,
    'client-build-manifest.json'
  )
  const buildManifestStr = await fs.readFile(manifestPath, 'utf-8')
  const buildManifest: ViteBuildManifest = JSON.parse(buildManifestStr)

  console.log('='.repeat(80))
  console.log('buildManifest', buildManifest)
  console.log('='.repeat(80))

  const indexEntry = Object.values(buildManifest).find((manifestItem) => {
    return manifestItem.isEntry
  })

  if (!indexEntry) {
    throw new Error('Could not find index.html in build manifest')
  }

  // 👉 1. Use static handler for assets
  // For CF workers, we'd need an equivalent of this
  app.use('/assets', express.static(rwPaths.web.dist + '/assets'))

  // 👉 2. Proxy the api server
  // TODO (STREAMING) we need to be able to specify whether proxying is required or not
  // e.g. deploying to Netlify, we don't need to proxy but configure it in Netlify
  // Also be careful of differences between v2 and v3 of the server
  app.use(
    rwConfig.web.apiUrl,
    // @WARN! Be careful, between v2 and v3 of http-proxy-middleware
    // the syntax has changed https://github.com/chimurai/http-proxy-middleware
    createProxyMiddleware({
      changeOrigin: true,
      pathRewrite: {
        [`^${rwConfig.web.apiUrl}`]: '', // remove base path
      },
      // Using 127.0.0.1 to force ipv4. With `localhost` you don't really know
      // if it's going to be ipv4 or ipv6
      target: `http://127.0.0.1:${rwConfig.api.port}`,
    })
  )

  app.use((req, _res, next) => {
    console.log('req.url', req.url)
    next()
  })

  // Mounting middleware at /RSC will strip /RSC from req.url
  app.use('/RSC', async (req, res) => {
    const basePath = '/RSC/'
    console.log('basePath', basePath)
    console.log('req.originalUrl', req.originalUrl, 'req.url', req.url)
    console.log('req.headers.host', req.headers.host)
    const url = new URL(req.originalUrl || '', 'http://' + req.headers.host)
    let rscId: string | undefined
    let props = {}
    let rsfId: string | undefined
    const args: unknown[] = []

    console.log('url.pathname', url.pathname)
    if (url.pathname.startsWith(basePath)) {
      const index = url.pathname.lastIndexOf('/')
      rscId = url.pathname.slice(basePath.length, index)
      console.log('rscId', rscId)
      const params = new URLSearchParams(url.pathname.slice(index + 1))
      if (rscId && rscId !== '_') {
        res.setHeader('Content-Type', 'text/x-component')
        props = JSON.parse(params.get('props') || '{}')
      } else {
        rscId = undefined
      }
      rsfId = params.get('action_id') || undefined
      if (rsfId) {
        console.warn('RSF is not supported yet')
        console.warn('RSF is not supported yet')
        console.warn('RSF is not supported yet')
        // if (req.headers["content-type"]?.startsWith("multipart/form-data")) {
        //   const bb = busboy({ headers: req.headers });
        //   const reply = decodeReplyFromBusboy(bb);
        //   req.pipe(bb);
        //   args = await reply;
        // } else {
        //   let body = "";
        //   for await (const chunk of req) {
        //     body += chunk;
        //   }
        //   if (body) {
        //     args = await decodeReply(body);
        //   }
        // }
      }
    }

    if (rscId || rsfId) {
      const pipeable = await renderRSC({ rscId, props, rsfId, args })

      // TODO handle errors

      // pipeable.on('error', (err) => {
      //   console.info('Cannot render RSC', err)
      //   res.statusCode = 500
      //   if (options.mode === 'development') {
      //     res.end(String(err))
      //   } else {
      //     res.end()
      //   }
      // })
      pipeable.pipe(res)
      return
    }
  })

  app.use(express.static(rwPaths.web.dist))

  app.listen(rwConfig.web.port)
  console.log(
    `Started production FE server on http://localhost:${rwConfig.web.port}`
  )
}

runFeServer()
