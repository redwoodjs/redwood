import React from 'react'

import { renderToReadableStream } from 'react-dom/server.edge';
import ReactClient from "react-server-dom-webpack/client.edge";
import { injectRSCPayload } from 'rsc-html-stream/server';
import type { ModuleRunner } from "vite/module-runner"



export async function handler(req: Request, { viteEnvRscRunner} : { viteEnvRscRunner: ModuleRunner}) {

  const { handler: rscHandler } = await viteEnvRscRunner.import('src/environments/entry-rsc.tsx')
  const rscResult = await rscHandler()

  const [rscStream1, rscStream2] = rscResult.stream.tee()
  let data: React.Usable<React.ReactNode>
  function Content() {
    data = data ?? ReactClient.createFromReadableStream(rscStream1, {
      ssrManifest: {
        moduleMap: {},
        moduleLoading: null
      }
    })
    return React.use(data)
  }

  const htmlStream = await renderToReadableStream(<Content />)
  const html = htmlStream.pipeThrough(injectRSCPayload(rscStream2))
  return new Response(html, { headers: { 'content-type': 'text/html' }})
}