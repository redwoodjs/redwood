import { getConfig } from '@redwoodjs/internal/dist/config'

export const authProvider = async (_parent: unknown) => {
  return getConfig().dashboard.authProvider
}

export const generateAuthHeaders = async (_parent: unknown, userId: number) => {
  // Get redwood lib to return those headers based on the user you want
  return { 'x-redwood-user': userId }
}
