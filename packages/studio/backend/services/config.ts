import type { ApiConfig, StudioConfig, WebConfig } from 'backend/types'

import { getApiConfig, getStudioConfig, getWebConfig } from '../lib/config'

export const apiConfig = async (_parent: unknown): Promise<ApiConfig> => {
  return getApiConfig()
}

export const webConfig = async (_parent: unknown): Promise<WebConfig> => {
  return getWebConfig()
}

export const studioConfig = async (_parent: unknown): Promise<StudioConfig> => {
  return getStudioConfig()
}
