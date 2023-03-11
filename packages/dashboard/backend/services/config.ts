import type { ApiConfig, DashboardConfig, WebConfig } from 'backend/types'

import { getApiConfig, getDashboardConfig, getWebConfig } from '../lib/config'

export const apiConfig = async (_parent: unknown): Promise<ApiConfig> => {
  return getApiConfig()
}

export const webConfig = async (_parent: unknown): Promise<WebConfig> => {
  return getWebConfig()
}

export const dashboardConfig = async (
  _parent: unknown
): Promise<DashboardConfig> => {
  return getDashboardConfig()
}
