import React from 'react'

import { renderToReadableStream } from 'react-server-dom-webpack/server.edge'

import { clientManifest } from './register/client.js'

export async function rscHandler({ Page }: { req: Request; Page: any }) {
  const stream = renderToReadableStream(<Page />, clientManifest())
  return { stream }
}
