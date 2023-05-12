import fs from 'node:fs'
import path from 'node:path'

import type { FastifyInstance, FastifyServerOptions } from 'fastify'

import { getPaths, getConfig } from '@redwoodjs/project-config'

import { FastifySideConfigFn, FastifySideConfigFnOptions } from './types'

/**
 * This is the default Fastify Server settings used by the
 * RedwoodJS dev server.
 *
 * It also applies when running RedwoodJS with `yarn rw serve`.
 *
 * For the Fastify server options that you can set, see:
 * https://www.fastify.io/docs/latest/Reference/Server/#factory
 *
 * Examples include: logger settings, timeouts, maximum payload limits, and more.
 *
 * Note: This configuration does not apply in a serverless deploy.
 */
export const DEFAULT_REDWOOD_FASTIFY_CONFIG: FastifyServerOptions = {
  requestTimeout: 15_000,
  logger: {
    // Note: If running locally using `yarn rw serve` you may want to adust
    // the default non-development level to `info`
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  },
}

let isServerConfigLoaded = false
let serverConfigFile: {
  config: FastifyServerOptions
  configureFastify: FastifySideConfigFn
} = {
  config: DEFAULT_REDWOOD_FASTIFY_CONFIG,
  configureFastify: async (fastify, options) => {
    fastify.log.info(
      options,
      `In configureFastify hook for side: ${options?.side}`
    )
    return fastify
  },
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

  // @TODO use require.resolve to find the config file
  // do we need to babel first?
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
