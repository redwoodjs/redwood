import initDbAuthMiddleware from '@redwoodjs/auth-dbauth-middleware'
import type { TagDescriptor } from '@redwoodjs/web/htmlTags'

import App from './App'
import { Document } from './Document'
import Routes from './Routes'

import { handler as dbAuthHandler } from '$api/src/functions/auth'
import { getCurrentUser, cookieName } from '$api/src/lib/auth'

interface Props {
  css: string[]
  meta?: TagDescriptor[]
}

export const ServerEntry: React.FC<Props> = ({ css, meta }) => {
  return (
    <Document css={css} meta={meta}>
      <App>
        <Routes />
      </App>
    </Document>
  )
}

export async function registerMiddleware() {
  const { middleware: selfMtsMw } = await import('./middleware/self.mjs')
  const authMw = initDbAuthMiddleware({
    dbAuthHandler,
    getCurrentUser,
    cookieName,
  })

  return [authMw, selfMtsMw]
}

