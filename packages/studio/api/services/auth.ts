import { getDBAuthHeader } from '../lib/authProviderEncoders/dbAuthEncoder'
import { getNetlifyAuthHeader } from '../lib/authProviderEncoders/netlifyAuthEncoder'
import { getSupabaseAuthHeader } from '../lib/authProviderEncoders/supabaseAuthEncoder'
import { getStudioConfig } from '../lib/config'

export const authProvider = async (_parent: unknown) => {
  return getStudioConfig().graphiql?.authImpersonation?.authProvider
}

export const generateAuthHeaders = async (
  _parent: unknown,
  { userId }: { userId?: string }
) => {
  const studioConfig = getStudioConfig()

  const provider = studioConfig.graphiql?.authImpersonation?.authProvider
  const impersonateUserId = studioConfig.graphiql?.authImpersonation?.userId
  const email = studioConfig.graphiql?.authImpersonation?.email
  const secret = studioConfig.graphiql?.authImpersonation?.jwtSecret

  if (provider == 'dbAuth') {
    return getDBAuthHeader(userId || impersonateUserId)
  }
  if (provider == 'netlify') {
    return getNetlifyAuthHeader(userId || impersonateUserId, email, secret)
  }

  if (provider == 'supabase') {
    return getSupabaseAuthHeader(userId || impersonateUserId, email)
  }

  return {}
}
