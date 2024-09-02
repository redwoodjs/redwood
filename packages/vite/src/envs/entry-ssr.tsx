import React from 'react'

import memoize from 'lodash/memoize.js'
import { renderToReadableStream } from 'react-dom/server.edge'
import ReactClient from 'react-server-dom-webpack/client.edge'
import { injectRSCPayload } from 'rsc-html-stream/server'
import type { ModuleRunner } from 'vite/module-runner'

import { getPageForRoute } from './__example__/routes.js'
import { moduleMap } from './register/ssr.js'

export async function ssrHandler(
  req: Request,
  { viteEnvRunnerRSC }: { viteEnvRunnerRSC: ModuleRunner },
) {
  globalThis.__webpack_require__ = memoize(
    (id: string) => import(/* @vite-ignore */ id),
  )

  // Determine if there's a valid page to render for the given URL.
  const url = new URL(req.url)
  const Page = await getPageForRoute(url.pathname)
  if (!Page) {
    return new Response('404', { status: 404 })
  }

  const { rscHandler } = await viteEnvRunnerRSC.import('src/envs/entry-rsc.tsx')
  const rscResult = await rscHandler(req, { Page })

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
  return new Response(html, { headers: { 'content-type': 'text/html' } })
}
