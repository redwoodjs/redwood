import { CORSOptions } from '@graphql-yoga/common'

import { CorsConfig } from '@redwoodjs/api'

export const mapRwCorsOptionsToYoga = (rwCorsConfig?: CorsConfig) => {
  const yogaCORSOptions: CORSOptions = {}

  if (rwCorsConfig?.methods) {
    if (typeof rwCorsConfig.methods === 'string') {
      yogaCORSOptions.methods = [rwCorsConfig.methods]
    } else if (Array.isArray(rwCorsConfig.methods)) {
      yogaCORSOptions.methods = rwCorsConfig.methods
    }
  }
  if (rwCorsConfig?.allowedHeaders) {
    if (typeof rwCorsConfig.allowedHeaders === 'string') {
      yogaCORSOptions.allowedHeaders = [rwCorsConfig.allowedHeaders]
    } else if (Array.isArray(rwCorsConfig.allowedHeaders)) {
      yogaCORSOptions.allowedHeaders = rwCorsConfig.allowedHeaders
    }
  }

  if (rwCorsConfig?.exposedHeaders) {
    if (typeof rwCorsConfig.exposedHeaders === 'string') {
      yogaCORSOptions.exposedHeaders = [rwCorsConfig.exposedHeaders]
    } else if (Array.isArray(rwCorsConfig.exposedHeaders)) {
      yogaCORSOptions.exposedHeaders = rwCorsConfig.exposedHeaders
    }
  }

  if (rwCorsConfig?.credentials) {
    yogaCORSOptions.credentials = rwCorsConfig.credentials
  }

  if (rwCorsConfig?.maxAge) {
    yogaCORSOptions.maxAge = rwCorsConfig.maxAge
  }

  return yogaCORSOptions
}
