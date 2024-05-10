# Supabase Middleware

---

NOTE: This README needs to be updated when the Supabase Web Auth will create a client and register the middleware

----

```tsx filename='entry.server.tsx'
import type { TagDescriptor } from '@redwoodjs/web'

import App from './App'
import  createSupabaseAuthMiddleware from '@redwoodjs/auth-supabase-middleware'
import { Document } from './Document'

import { getCurrentUser } from '$api/src/lib/auth'

interface Props {
  css: string[]
  meta?: TagDescriptor[]
}

export const registerMiddleware = () => {
  const supabaseAuthMiddleware = createSupabaseAuthMiddleware({
    // Optional. If not set, Supabase will use its own `currentUser` function
    // instead of your app's
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
