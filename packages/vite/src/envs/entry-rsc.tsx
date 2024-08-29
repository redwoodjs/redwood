import React from 'react'

import { renderToReadableStream } from 'react-server-dom-webpack/server.edge'

// TODO: Define a proper entry point.
import { Page } from './__example__/Page.jsx'
import { clientManifest } from './register/client.js'

export async function rscHandler(_req: Request) {
  const stream = renderToReadableStream(<Page />, clientManifest())
  return { stream }
}
