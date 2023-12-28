import { getApiConfig, getStudioConfig, getWebConfig } from '../lib/config'
import type { ApiConfig, StudioConfig, WebConfig } from '../types'

export const apiConfig = async (_parent: unknown): Promise<ApiConfig> => {
  return getApiConfig()
}

export const webConfig = async (_parent: unknown): Promise<WebConfig> => {
  return getWebConfig()
}

export const studioConfig = async (_parent: unknown): Promise<StudioConfig> => {
  return getStudioConfig()
}
