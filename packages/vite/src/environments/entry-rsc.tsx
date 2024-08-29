import React from 'react'

import { renderToReadableStream } from 'react-server-dom-webpack/server.edge'

// TODO: Define a proper entry point.
import { Page } from './__example__/Page.jsx'

export async function rscHandler(req: Request) {
  const stream = renderToReadableStream(<Page />, {})
  return { stream }
}
