import fs from 'fs'
import path from 'path'

import Fastify from 'fastify'
import type { FastifyInstance, FastifyServerOptions } from 'fastify'

import { getConfig, getPaths } from '@redwoodjs/internal'

export type FastifySideConfigFnOptions = {
  side: SupportedSides
  apiRootPath?: string
  apiUrl?: string
  apiHost?: string
} & Record<string, any>

export type SupportedSides = 'api' | 'web' | 'proxy'
export type FastifySideConfigFn = (
  fastify: FastifyInstance,
  options?: FastifySideConfigFnOptions
) => Promise<FastifyInstance>
const DEFAULT_OPTIONS = {
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  },
}

let isServerConfigLoaded = false
let serverConfigFile: {
  config: FastifyServerOptions
  configureFastifyForSide: FastifySideConfigFn
} = {
  config: DEFAULT_OPTIONS,
  configureFastifyForSide: async (fastify, options) => {
    fastify.log.info(
      options,
      `In configureFastifyForSide hook for side: ${options?.side}`
    )
    return fastify
  },
}

export function loadFastifyConfig() {
  const serverConfigPath = path.join(
    getPaths().base,
    getConfig().api.serverConfig
  )

  // If a server.config.js is not found, use the default
  // options set in packages/api-server/src/app.ts
  if (!fs.existsSync(serverConfigPath)) {
    return serverConfigFile
  }

  if (!isServerConfigLoaded) {
    console.log(`Loading server config from ${serverConfigPath} \n`)
    serverConfigFile = { ...require(serverConfigPath) }
    isServerConfigLoaded = true
  }

  return serverConfigFile
}

export const createFastifyInstance = (
  options?: FastifyServerOptions
): FastifyInstance => {
  const { config } = loadFastifyConfig()

  const fastify = Fastify(options || config || DEFAULT_OPTIONS)

  return fastify
}

export default createFastifyInstance
