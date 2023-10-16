import type { FastifyInstance } from 'fastify'

import type { HttpServerParams } from './server'

export interface WebServerArgs extends Omit<HttpServerParams, 'fastify'> {
  apiHost?: string
}

export interface ApiServerArgs extends Omit<HttpServerParams, 'fastify'> {
  apiRootPath: string // either user supplied or '/'
  loadEnvFiles: boolean
}

export type BothServerArgs = Omit<HttpServerParams, 'fastify'>

// Types for using server.config.js
export type FastifySideConfigFnOptions = {
  side: SupportedSides
} & (WebServerArgs | BothServerArgs | ApiServerArgs)

export type SupportedSides = 'api' | 'web'
export type FastifySideConfigFn = (
  fastify: FastifyInstance,
  options?: FastifySideConfigFnOptions
) => Promise<FastifyInstance> | void
