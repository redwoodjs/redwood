import { getDBAuthHeader } from '../lib/authProviderEncoders/dbAuthEncoder'
import { getNetlifyAuthHeader } from '../lib/authProviderEncoders/netlifyAuthEncoder'
import { getSupabaseAuthHeader } from '../lib/authProviderEncoders/supabaseAuthEncoder'
import { getDashboardConfig } from '../lib/config'

export const authProvider = async (_parent: unknown) => {
  return getDashboardConfig().authProvider
}

export const generateAuthHeaders = async (
  _parent: unknown,
  { userId }: { userId?: string }
) => {
  const dashboardConfig = getDashboardConfig()

  const provider = dashboardConfig.authProvider
  const impersonateUserId = dashboardConfig.userId
  const email = dashboardConfig.email

  if (provider == 'dbAuth') {
    return getDBAuthHeader(userId || impersonateUserId)
  }
  if (provider == 'netlify') {
    return getNetlifyAuthHeader(userId || impersonateUserId, email)
  }

  if (provider == 'supabase') {
    return getSupabaseAuthHeader(userId || impersonateUserId, email)
  }

  return {}
}
