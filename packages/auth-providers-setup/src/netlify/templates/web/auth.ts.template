import netlifyIdentity from 'netlify-identity-widget'

import { createNetlifyAuth } from '@redwoodjs/auth-providers-web'
import { isBrowser } from '@redwoodjs/prerender/browserUtils'

isBrowser && netlifyIdentity.init()

export const { AuthProvider, useAuth } = createNetlifyAuth(netlifyIdentity)
