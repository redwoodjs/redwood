import OgImageMiddleware from "@redwoodjs/ogimage-gen/middleware";
import type { TagDescriptor } from '@redwoodjs/web'

import App from './App.js'
import { Document } from './Document.js'

interface Props {
  css: string[]
  meta?: TagDescriptor[]
}

export const ServerEntry: React.FC<Props> = ({ css, meta }) => {
  return (
    <Document css={css} meta={meta}>
      <App />
    </Document>
  )
}

export const registerMiddleware = async () => {
  const ogMw = new OgImageMiddleware({
    App,
    Document,
  });

  return [ogMw];
}
