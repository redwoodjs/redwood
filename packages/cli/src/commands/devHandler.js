import fs from 'fs'
import { argv } from 'process'

import concurrently from 'concurrently'
import portfinder from 'portfinder'
import prompts from 'prompts'

import { getConfig } from '@redwoodjs/internal/dist/config'
import { shutdownPort } from '@redwoodjs/internal/dist/dev'
import { getConfigPath } from '@redwoodjs/internal/dist/paths'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { getPaths } from '../lib'
import c from '../lib/colors'
import { generatePrismaClient } from '../lib/generatePrismaClient'

const defaultApiDebugPort = 18911

/**
 * Finds a free port
 * @param  {[number]}   requestedPort Port to start searching from
 * @param  {[number[]]} excludePorts  Array of port numbers to exclude
 * @return {[number]}                 A free port equal or higher than requestedPort but not within excludePorts. If no port can be found then returns -1
 */
async function getFreePort(requestedPort, excludePorts = []) {
  try {
    let freePort = await portfinder.getPortPromise({
      port: requestedPort,
    })
    if (excludePorts.includes(freePort)) {
      freePort = await getFreePort(freePort + 1, excludePorts)
    }
    return freePort
  } catch (error) {
    return -1
  }
}

export const handler = async ({
  side = ['api', 'web'],
  forward = '',
  generate = true,
  watchNodeModules = process.env.RWJS_WATCH_NODE_MODULES === '1',
  apiDebugPort,
}) => {
  const rwjsPaths = getPaths()

  let apiPort = getConfig().api.port
  let webPort = getConfig().web.port

  // Check api port
  if (side.includes('api')) {
    const freePort = await getFreePort(apiPort)
    if (freePort === -1) {
      console.error(
        c.error(
          `Can't start dev server: port ${apiPort} for the api server is already in use and no neighboring port is available`
        )
      )
      process.exit(1)
    }
    if (freePort !== apiPort) {
      console.log(
        c.warning(
          `Port ${apiPort} for the api server is already in use but ${freePort} is available`
        )
      )
      const useAvailablePort = await prompts({
        type: 'confirm',
        name: 'port',
        message: `Ok to use ${freePort} instead?`,
        initial: true,
        active: 'Yes',
        inactive: 'No',
      })
      if (!useAvailablePort.port) {
        console.log(c.info('The api port can be set in redwood.toml'))
        process.exit(1)
      }
    }
    apiPort = freePort

    // TODO: Check the apiDebugPort too?
  }

  // Check web port
  if (side.includes('web')) {
    // Check for specific forwarded web port

    const forwardedPortMatches = forward.match(
      /--port=[0-9][0-9]?[0-9]?[0-9]?[0-9]? ?/
    )
    const forwardedPortSet =
      forwardedPortMatches && forwardedPortMatches.length == 1
    if (forwardedPortSet) {
      webPort = forwardedPortMatches[0]
        .substring(forwardedPortMatches[0].indexOf('=') + 1)
        .trim()
    }

    const freePort = await getFreePort(webPort, [apiPort])
    if (freePort === -1) {
      console.error(
        c.error(
          `Can't start dev server: web port ${webPort} is already in use and no neighboring port is available`
        )
      )
      process.exit(1)
    }
    if (freePort !== webPort) {
      console.log(
        c.warning(
          `Port ${webPort} for the web server is already in use but ${freePort} is available`
        )
      )
      const useAvailablePort = await prompts({
        type: 'confirm',
        name: 'port',
        message: `Ok to use ${freePort} instead?`,
        initial: true,
        active: 'Yes',
        inactive: 'No',
      })
      if (!useAvailablePort.port) {
        console.log(
          c.info(
            `The web port can be set in redwood.toml or can be forwarded to webpack dev server via the '--fwd' flag: 'yarn rw dev --fwd="--port=1234"'`
          )
        )
        process.exit(1)
      }
    }
    webPort = freePort
    forward = forwardedPortSet
      ? forward.replace(forwardedPortMatches[0], ` --port=${freePort}`)
      : forward.concat(` --port=${freePort}`)
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
      await shutdownPort(apiPort)
    } catch (e) {
      errorTelemetry(process.argv, `Error shutting down "api": ${e.message}`)
      console.error(
        `Error whilst shutting down "api" port: ${c.error(e.message)}`
      )
    }
  }

  if (side.includes('web')) {
    try {
      await shutdownPort(webPort)
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
      command: `yarn cross-env NODE_ENV=development NODE_OPTIONS=--enable-source-maps yarn nodemon --quiet --watch "${redwoodConfigPath}" --exec "yarn rw-api-server-watch --port=${apiPort} ${getApiDebugFlag()} | rw-log-formatter"`,
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
