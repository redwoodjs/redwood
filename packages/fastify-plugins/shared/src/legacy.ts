import fs from 'node:fs'
import path from 'node:path'

import Fastify from 'fastify'
import type { FastifyServerOptions, FastifyInstance } from 'fastify'

import { getConfig, getPaths } from '@redwoodjs/project-config'

import { DEFAULT_REDWOOD_FASTIFY_CONFIG } from './index'

// NOTE: Copied from the now extinct @redwoodjs/fastify
// ------------------------------------------------------------
let isServerConfigLoaded = false

let serverConfigFile: {
  config: FastifyServerOptions
  configureFastify: FastifySideConfigFn
} = {
  config: DEFAULT_REDWOOD_FASTIFY_CONFIG,
  configureFastify: async (fastify, options) => {
    fastify.log.trace(
      options,
      `In configureFastify hook for side: ${options?.side}`
    )
    return fastify
  },
}

export function createFastifyInstance(options?: FastifyServerOptions) {
  const { config } = loadFastifyConfig()
  return Fastify(options || config || DEFAULT_REDWOOD_FASTIFY_CONFIG)
}

export function loadFastifyConfig() {
  const serverFileExists =
    fs.existsSync(path.join(getPaths().api.src, 'server.js')) ||
    fs.existsSync(path.join(getPaths().api.src, 'server.ts'))

  if (serverFileExists) {
    console.log(
      "Ignoring Fastify config inside 'api/src/server.config.(js|ts)'"
    )

    return {
      config: {},
      configureFastify: async (
        fastify: FastifyInstance,
        _options: FastifySideConfigFnOptions
      ) => fastify,
    }
  }

  // TODO: Use `require.resolve` to find the config file. Do we need to babel first?
  const serverConfigPath = path.join(
    getPaths().base,
    getConfig().api.serverConfig
  )

  // If a server.config.js is not found, use the default options.
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

// Types for using server.config.js
export interface RedwoodFastifyAPIOptions {
  redwood?: {
    apiRootPath?: string
  }
}

export interface RedwoodFastifyWebOptions {
  redwood?: {
    apiHost?: string
  }
}

export type FastifySideConfigFnOptions = {
  side: SupportedSides
} & (
  | RedwoodFastifyWebOptions
  | RedwoodFastifyAPIOptions
  | (RedwoodFastifyWebOptions & RedwoodFastifyAPIOptions)
)

export type FastifySideConfigFn = (
  fastify: FastifyInstance,
  options?: FastifySideConfigFnOptions
) => Promise<FastifyInstance> | void

export type SupportedSides = 'api' | 'web'

// ------------------------------------------------------------
