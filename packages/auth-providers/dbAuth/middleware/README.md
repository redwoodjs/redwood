# DbAuth Middleware

```tsx filename='entry.server.tsx'
import type { TagDescriptor } from '@redwoodjs/web'

import App from './App'
import initDbAuthMiddleware from '@redwoodjs/auth-dbauth-middleware'
import { Document } from './Document'

import { handler as dbAuthHandler } from '$api/src/functions/auth'
import { cookieName } from '$api/src/lib/auth'
import { getCurrentUser } from '$api/src/lib/auth'
interface Props {
  css: string[]
  meta?: TagDescriptor[]
}

export const registerMiddleware = () => {
  // This actually returns [dbAuthMiddleware, '*']
  const authMw = initDbAuthMiddleware({
    cookieName,
    dbAuthHandler,
    getCurrentUser,
    // dbAuthUrl? optional
  })
  
  return [authMw]
}

export const ServerEntry: React.FC<Props> = ({ css, meta }) => {
  return (
    <Document css={css} meta={meta}>
      <App />
    </Document>
  )
}
```
