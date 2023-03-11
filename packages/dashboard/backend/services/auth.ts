import { getDBAuthHeader } from '../lib/authProviderEncoders/dbAuthEncoder'
import { getNetlifyAuthHeader } from '../lib/authProviderEncoders/netlifyAuthEncoder'
import { getSupabaseAuthHeader } from '../lib/authProviderEncoders/supabaseAuthEncoder'

import { dashboardConfig } from './config'

export const authProvider = async (_parent: unknown) => {
  return (await dashboardConfig(_parent)).authProvider
}

export const generateAuthHeaders = async (
  _parent: unknown,
  { userId }: { userId: string }
) => {
  const provider = await authProvider(_parent)

  if (provider == 'dbAuth') {
    return getDBAuthHeader(userId)
  }
  if (provider == 'netlify') {
    return getNetlifyAuthHeader(userId)
  }

  if (provider == 'supabase') {
    return getSupabaseAuthHeader(userId)
  }

  return {}
}
