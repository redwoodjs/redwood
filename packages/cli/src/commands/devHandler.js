import fs from 'fs'
import { argv } from 'process'

import concurrently from 'concurrently'

import { getConfig } from '@redwoodjs/internal/dist/config'
import { shutdownPort } from '@redwoodjs/internal/dist/dev'
import { getConfigPath } from '@redwoodjs/internal/dist/paths'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../lib'
import c from '../lib/colors'
import { generatePrismaClient } from '../lib/generatePrismaClient'

const defaultApiDebugPort = 18911

export const handler = async ({
  side = ['api', 'web'],
  forward = '',
  generate = true,
  watchNodeModules = process.env.RWJS_WATCH_NODE_MODULES === '1',
  apiDebugPort,
}) => {
  const rwjsPaths = getPaths()

  if (side.includes('api')) {
    try {
      await generatePrismaClient({
        verbose: false,
        force: false,
        schema: rwjsPaths.api.dbSchema,
      })
    } catch (e) {
      errorTelemetry(
        process.argv,
        `Error generating prisma client: ${e.message}`
      )
      console.error(c.error(e.message))
    }

    try {
      await shutdownPort(getConfig().api.port)
    } catch (e) {
      errorTelemetry(process.argv, `Error shutting down "api": ${e.message}`)
      console.error(
        `Error whilst shutting down "api" port: ${c.error(e.message)}`
      )
    }
  }

  if (side.includes('web')) {
    try {
      await shutdownPort(getConfig().web.port)
    } catch (e) {
      errorTelemetry(process.argv, `Error shutting down "web": ${e.message}`)
      console.error(
        `Error whilst shutting down "web" port: ${c.error(e.message)}`
      )
    }
  }

  const webpackDevConfig = require.resolve(
    '@redwoodjs/core/config/webpack.development.js'
  )

  const getApiDebugFlag = () => {
    // Passed in flag takes precedence
    if (apiDebugPort) {
      return `--debug-port ${apiDebugPort}`
    } else if (argv.includes('--apiDebugPort')) {
      return `--debug-port ${defaultApiDebugPort}`
    }

    const apiDebugPortInToml = getConfig().api.debugPort
    if (apiDebugPortInToml) {
      return `--debug-port ${apiDebugPortInToml}`
    }

    // Dont pass in debug port flag, unless configured
    return ''
  }

  const redwoodConfigPath = getConfigPath()

  /** @type {Record<string, import('concurrently').CommandObj>} */
  const jobs = {
    api: {
      name: 'api',
      command: `yarn cross-env NODE_ENV=development NODE_OPTIONS=--enable-source-maps yarn nodemon --quiet --watch "${redwoodConfigPath}" --exec "yarn rw-api-server-watch ${getApiDebugFlag()} | rw-log-formatter"`,
      prefixColor: 'cyan',
      runWhen: () => fs.existsSync(rwjsPaths.api.src),
    },
    web: {
      name: 'web',
      command: `cd "${
        rwjsPaths.web.base
      }" && yarn cross-env NODE_ENV=development RWJS_WATCH_NODE_MODULES=${
        watchNodeModules ? '1' : ''
      } webpack serve --config "${webpackDevConfig}" ${forward}`,
      prefixColor: 'blue',
      runWhen: () => fs.existsSync(rwjsPaths.web.src),
    },
    gen: {
      name: 'gen',
      command: 'yarn rw-gen-watch',
      prefixColor: 'green',
      runWhen: () => generate,
    },
  }

  // TODO: Convert jobs to an array and supply cwd command.
  const { result } = concurrently(
    Object.keys(jobs)
      .map((job) => {
        if (side.includes(job) || job === 'gen') {
          return jobs[job]
        }
      })
      .filter((job) => job && job.runWhen()),
    {
      prefix: '{name} |',
      timestampFormat: 'HH:mm:ss',
    }
  )
  result.catch((e) => {
    if (typeof e?.message !== 'undefined') {
      errorTelemetry(
        process.argv,
        `Error concurrently starting sides: ${e.message}`
      )
      console.error(c.error(e.message))
      process.exit(1)
    }
  })
}
