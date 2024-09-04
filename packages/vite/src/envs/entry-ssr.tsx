import React from 'react'

import memoize from 'lodash/memoize.js'
import { renderToReadableStream } from 'react-dom/server.edge'
import ReactClient from 'react-server-dom-webpack/client.edge'
import { injectRSCPayload } from 'rsc-html-stream/server'
import type { ModuleRunner } from 'vite/module-runner'

import { getPageForRoute } from './__example__/routes.js'
import { moduleMap } from './register/ssr.js'

export async function ssrHandler(opts: {
  req: Request
  viteEnvRunnerRSC: ModuleRunner
}) {
  const { req, viteEnvRunnerRSC } = opts
  globalThis.__webpack_require__ = memoize(
    (id: string) => import(/* @vite-ignore */ id),
  )

  // TODO: Make this a Plugin.
  // Show off idea of "everything is a plugin."
  // Determine if there's a valid page to render for the given URL.
  const url = new URL(req.url)
  let notfound = false
  let Page = await getPageForRoute({
    pathname: url.pathname,
    viteEnvRunner: viteEnvRunnerRSC,
  })
  if (!Page) {
    notfound = true
    const { default: notFoundPage } = await viteEnvRunnerRSC.import(
      'virtual:redwoodjs-not-found-page',
    )
    Page = notFoundPage
  }
  const { rscHandler } = await viteEnvRunnerRSC.import('src/envs/entry-rsc.tsx')
  const rscResult = await rscHandler({ req, Page })

  const [rscStream1, rscStream2] = rscResult.stream.tee()
  let data: React.Usable<React.ReactNode>
  function Content() {
    data =
      data ??
      ReactClient.createFromReadableStream(rscStream1, {
        ssrManifest: {
          moduleMap: moduleMap(),
          moduleLoading: null,
        },
      })
    return React.use(data)
  }

  const htmlStream = await renderToReadableStream(<Content />)
  const html = htmlStream.pipeThrough(injectRSCPayload(rscStream2))
  return new Response(html, {
    headers: { 'content-type': 'text/html' },
    status: notfound ? 404 : 200,
  })
}
