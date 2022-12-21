import path from 'path'

import { getPaths } from '../../../lib'
import { isTypeScriptProject } from '../../../lib/project'

import { supportedProviders } from './supportedProviders'

export const generatePayload = (provider, id, token, expiry) => {
  if (token) {
    return {
      'auth-provider': provider,
      authorization: `Bearer ${token}`,
    }
  }

  return supportedProviders[provider].getPayload(id, expiry)
}

export const getOutputPath = () => {
  return path.join(
    getPaths().api.lib,
    isTypeScriptProject()
      ? 'generateGraphiQLHeader.ts'
      : 'generateGraphiQLHeader.js'
  )
}
