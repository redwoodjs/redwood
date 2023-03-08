import { dashboardConfig } from './config'

export const authProvider = async (_parent: unknown) => {
  return (await dashboardConfig(_parent)).authProvider
}

export const generateAuthHeaders = async (
  _parent: unknown,
  { userId }: { userId: string }
) => {
  // Get redwood lib to return those headers based on the user you want
  const authHeaders = {
    authProvider: await authProvider(_parent),
    authorization: `Bearer token ${userId}`,
  }

  return authHeaders
}
