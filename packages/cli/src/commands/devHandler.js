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
import { getFreePort } from '../lib/ports'

const defaultApiDebugPort = 18911

export const handler = async ({
  side = ['api', 'web'],
  forward = '',
  generate = true,
  watchNodeModules = process.env.RWJS_WATCH_NODE_MODULES === '1',
  apiDebugPort,
}) => {
  const rwjsPaths = getPaths()

  // Starting values of ports from config (redwood.toml)
  let apiPreferredPort = parseInt(getConfig().api.port)
  let webPreferredPort = parseInt(getConfig().web.port)

  // Assume we can have the ports we want
  let apiAvailablePort = apiPreferredPort
  let apiPortChangeNeeded = false
  let webAvailablePort = webPreferredPort
  let webPortChangeNeeded = false

  // Check api port
  if (side.includes('api')) {
    apiAvailablePort = await getFreePort(apiPreferredPort)
    if (apiAvailablePort === -1) {
      console.error(`Error could not determine a free port for the api server`)
      process.exit(1)
    }
    apiPortChangeNeeded = apiAvailablePort !== apiPreferredPort
  }

  // Check web port
  if (side.includes('web')) {
    // Extract any ports the user forwarded to the webpack server and prefer that instead
    const forwardedPortMatches = [
      ...forward.matchAll(/\-\-port(\=|\s)(?<port>[^\s]*)/g),
    ]
    if (forwardedPortMatches.length) {
      webPreferredPort = forwardedPortMatches.pop().groups.port
    }

    webAvailablePort = await getFreePort(webPreferredPort, [
      apiPreferredPort,
      apiAvailablePort,
    ])
    if (webAvailablePort === -1) {
      console.error(`Error could not determine a free port for the web server`)
      process.exit(1)
    }
    webPortChangeNeeded = webAvailablePort !== webPreferredPort
  }

  // Check for port conflict and exit with message if found
  if (apiPortChangeNeeded || webPortChangeNeeded) {
    let message = `The currently configured ports for the development server are unavailable. Suggested changes to your ports, which can be changed in redwood.toml, are:\n`
    message += apiPortChangeNeeded
      ? `  - API to use port ${apiAvailablePort} instead of your currently configured ${apiPreferredPort}\n`
      : ``
    message += webPortChangeNeeded
      ? `  - Web to use port ${webAvailablePort} instead of your currently configured ${webPreferredPort}\n`
      : ``
    console.error(message)
    console.error(
      `Cannot run the development server until your configured ports are changed or become available.`
    )
    process.exit(1)
  }

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
      await shutdownPort(apiAvailablePort)
    } catch (e) {
      errorTelemetry(process.argv, `Error shutting down "api": ${e.message}`)
      console.error(
        `Error whilst shutting down "api" port: ${c.error(e.message)}`
      )
    }
  }

  if (side.includes('web')) {
    try {
      await shutdownPort(webAvailablePort)
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

  const webCommand =
    getConfig().web.bundler === 'vite' // @NOTE: can't use enums, not TS
      ? `yarn cross-env NODE_ENV=development rw-vite-dev`
      : `yarn cross-env NODE_ENV=development RWJS_WATCH_NODE_MODULES=${
          watchNodeModules ? '1' : ''
        } webpack serve --config "${webpackDevConfig}" ${forward}`

  /** @type {Record<string, import('concurrently').CommandObj>} */
  const jobs = {
    api: {
      name: 'api',
      command: `yarn cross-env NODE_ENV=development NODE_OPTIONS=--enable-source-maps yarn nodemon --quiet --watch "${redwoodConfigPath}" --exec "yarn rw-api-server-watch --port ${apiAvailablePort} ${getApiDebugFlag()} | rw-log-formatter"`,
      prefixColor: 'cyan',
      runWhen: () => fs.existsSync(rwjsPaths.api.src),
    },
    web: {
      name: 'web',
      command: webCommand,
      prefixColor: 'blue',
      cwd: rwjsPaths.web.base,
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
      handleInput: true,
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
