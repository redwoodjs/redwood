import { getDBAuthHeader } from '../lib/authProviderEncoders/dbAuthEncoders'

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

  return {}
}
