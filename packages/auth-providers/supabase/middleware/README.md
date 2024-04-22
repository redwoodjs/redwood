# Supabase Middleware


```tsx filename='entry.server.tsx'
import type { TagDescriptor } from '@redwoodjs/web'

import App from './App'
import { createSupabaseMiddleware } from '@redwoodjs/auth-supabase-middleware'
import { Document } from './Document'

// eslint-disable-next-line no-restricted-imports
import { cookieName } from '$api/src/lib/auth'
import { getCurrentUser } from '$api/src/lib/auth'
interface Props {
  css: string[]
  meta?: TagDescriptor[]
}

export const registerMiddleware = () => {
  const supabaseAuthMiddleware = createSupabaseMiddleware({
    // cookieName,
    getCurrentUser,
  })
  return [supabaseAuthMiddleware]
}

export const ServerEntry: React.FC<Props> = ({ css, meta }) => {
  return (
    <Document css={css} meta={meta}>
      <App />
    </Document>
  )
}
```
