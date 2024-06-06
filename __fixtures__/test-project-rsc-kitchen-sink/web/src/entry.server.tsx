import type { TagDescriptor } from '@redwoodjs/web/dist/components/htmlTags'

import App from './App'
import { Document } from './Document'
import Routes from './Routes'

interface Props {
  css: string[]
  meta?: TagDescriptor[]
  location: {
    pathname: string
    hash?: string
    search?: string
  }
}

export const ServerEntry: React.FC<Props> = ({ css, meta, location }) => {
  return (
    <Document css={css} meta={meta}>
      <App>
        <Routes location={location} />
      </App>
    </Document>
  )
}

export async function registerMiddleware() {
  const { middleware: selfMtsMw } = await import('./middleware/self.mjs')

  return [selfMtsMw]
}
