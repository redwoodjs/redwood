import jwt from 'jsonwebtoken'

import { SUPABASE_JWT_SECRET } from '../envars'

const getExpiryTime = () => {
  return Date.now() + 3600 * 1000
}

export const getSupabaseAuthHeader = (userId?: string, email?: string) => {
  if (!SUPABASE_JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET env var is not set.')
  }

  const payload = {
    aud: 'authenticated',
    exp: getExpiryTime(),
    sub: userId ?? 'test-user-id',
    email: email ?? 'user@example.com',
    app_metadata: {
      provider: 'email',
    },
    user_metadata: {},
    role: 'authenticated',
    roles: [],
  }

  const token = jwt.sign(payload, SUPABASE_JWT_SECRET)

  return {
    authProvider: 'supabase',
    authorization: `Bearer ${token}`,
  }
}
