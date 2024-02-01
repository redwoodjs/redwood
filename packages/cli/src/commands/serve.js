import path from 'path'

import fs from 'fs-extra'
import terminalLink from 'terminal-link'

import * as apiServerCLIConfig from '@redwoodjs/api-server/dist/apiCLIConfig'
import * as bothServerCLIConfig from '@redwoodjs/api-server/dist/bothCLIConfig'
import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'
import * as webServerCLIConfig from '@redwoodjs/web-server'

import { getPaths } from '../lib'
import c from '../lib/colors'

export const command = 'serve [side]'
export const description =
  'Start a server for serving both the api and web sides'

function hasServerFile() {
  const serverFilePath = path.join(getPaths().api.dist, 'server.js')
  return fs.existsSync(serverFilePath)
}

export const builder = async (yargs) => {
  yargs
    .command({
      command: '$0',
      description: bothServerCLIConfig.description,
      builder: bothServerCLIConfig.builder(yargs),
      handler: async (argv) => {
        recordTelemetryAttributes({
          command: 'serve',
          port: argv.port,
          host: argv.host,
          socket: argv.socket,
        })

        // Run the server file, if it exists, with web side also
        if (hasServerFile()) {
          const { bothServerFileHandler } = await import('./serveHandler.js')
          await bothServerFileHandler(argv)
        } else {
          await bothServerCLIConfig.handler(argv)
        }
      },
    })
    .command({
      command: 'api',
      description: apiServerCLIConfig.description,
      builder: apiServerCLIConfig.builder,
      handler: async (argv) => {
        recordTelemetryAttributes({
          command: 'serve',
          port: argv.port,
          host: argv.host,
          socket: argv.socket,
          apiRootPath: argv.apiRootPath,
        })

        // Run the server file, if it exists, api side only
        if (hasServerFile()) {
          const { apiServerFileHandler } = await import('./serveHandler.js')
          await apiServerFileHandler(argv)
        } else {
          await apiServerCLIConfig.handler(argv)
        }
      },
    })
    .command({
      command: 'web',
      description: webServerCLIConfig.description,
      builder: webServerCLIConfig.builder,
      handler: async (argv) => {
        recordTelemetryAttributes({
          command: 'serve',
          port: argv.port,
          host: argv.host,
          socket: argv.socket,
          apiHost: argv.apiHost,
        })

        await webServerCLIConfig.handler(argv)
      },
    })
    .middleware((argv) => {
      recordTelemetryAttributes({
        command: 'serve',
      })

      // Make sure the relevant side has been built, before serving
      const positionalArgs = argv._

      if (
        positionalArgs.includes('web') &&
        !fs.existsSync(path.join(getPaths().web.dist), 'index.html')
      ) {
        console.error(
          c.error(
            '\n Please run `yarn rw build web` before trying to serve web. \n'
          )
        )
        process.exit(1)
      }

      if (
        positionalArgs.includes('api') &&
        !fs.existsSync(path.join(getPaths().api.dist))
      ) {
        console.error(
          c.error(
            '\n Please run `yarn rw build api` before trying to serve api. \n'
          )
        )
        process.exit(1)
      }

      if (
        // serve both
        positionalArgs.length === 1 &&
        (!fs.existsSync(path.join(getPaths().api.dist)) ||
          !fs.existsSync(path.join(getPaths().web.dist), 'index.html'))
      ) {
        console.error(
          c.error(
            '\n Please run `yarn rw build` before trying to serve your redwood app. \n'
          )
        )
        process.exit(1)
      }

      // Set NODE_ENV to production, if not set
      if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'production'
      }
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#serve'
      )}`
    )
}
