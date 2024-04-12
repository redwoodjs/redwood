# DbAuth Middleware


```tsx filename='entry.server.tsx'
import type { TagDescriptor } from '@redwoodjs/web'

import App from './App'
import { createDbAuthMiddleware } from '@redwoodjs/auth-dbauth-middleware'
import { Document } from './Document'

// eslint-disable-next-line no-restricted-imports
import { handler as dbAuthHandler } from '$api/src/functions/auth'
import { cookieName } from '$api/src/lib/auth'
import { getCurrentUser } from '$api/src/lib/auth'
interface Props {
  css: string[]
  meta?: TagDescriptor[]
}

export const registerMiddleware = () => {
  const dbAuthMiddleware = createDbAuthMiddleware({
    cookieName,
    dbAuthHandler,
    getCurrentUser,
    // dbAuthUrl? optional
  })
  return [dbAuthMiddleware]
}

export const ServerEntry: React.FC<Props> = ({ css, meta }) => {
  return (
    <Document css={css} meta={meta}>
      <App />
    </Document>
  )
}
```
