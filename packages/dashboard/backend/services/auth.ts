import { getDBAuthHeader } from '../lib/authEncoders'

import { dashboardConfig } from './config'
export const authProvider = async (_parent: unknown) => {
  return (await dashboardConfig(_parent)).authProvider
}

export const generateAuthHeaders = async (
  _parent: unknown,
  { userId }: { userId: string }
) => {
  const authHeaders = getDBAuthHeader(userId)

  return authHeaders
}
