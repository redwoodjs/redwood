import React from 'react'

import { renderToReadableStream } from "react-server-dom-webpack/server.edge";

import { Page } from './Page.jsx'

export async function handler(req: Request) {
  const stream = renderToReadableStream(<Page />, {})
  return { stream }

}