# Supabase Middleware

```tsx filename='entry.server.tsx'
import type { TagDescriptor } from '@redwoodjs/web'

import App from './App'
import  initSupabaseMiddleware from '@redwoodjs/auth-supabase-middleware'
import { Document } from './Document'

import { getCurrentUser } from '$api/src/lib/auth'

interface Props {
  css: string[]
  meta?: TagDescriptor[]
}

type SupabaseAppMetadata = {
  provider: string
  providers: string[]
  roles: string[]
}

export const registerMiddleware = () => {
  const supabaseAuthMiddleware = initSupabaseMiddleware({
    // Optional. If not set, Supabase will use its own `currentUser` function
    // instead of your app's
    getCurrentUser,
    // Optional. If you wish to enforce RBAC, define a function to return roles.
    // Typically, one will define roles in Supabase in the user's app_metadata.
    getRoles: ({ app_metadata }: { app_metadata: SupabaseAppMetadata }) => {
      return app_metadata.roles
    },
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
