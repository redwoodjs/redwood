import type { FastifyInstance } from 'fastify'

export interface RedwoodFastifyAPIOptions {
  redwood?: {
    apiRootPath?: string
  }
}

// Types for using server.config.js
export type FastifySideConfigFnOptions = {
  side: SupportedSides
} & (
  | RedwoodFastifyAPIOptions
)

export type SupportedSides = 'api' | 'web'
export type FastifySideConfigFn = (
  fastify: FastifyInstance,
  options?: FastifySideConfigFnOptions
) => Promise<FastifyInstance> | void
