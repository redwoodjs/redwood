import path from 'path'

import fs from 'fs-extra'
import terminalLink from 'terminal-link'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { getPaths, getConfig } from '../lib'
import c from '../lib/colors'

import { webServerHandler, webSsrServerHandler } from './serveWebHandler'

export const command = 'serve [side]'
export const description = 'Run server for api or web in production'

function hasExperimentalServerFile() {
  const serverFilePath = path.join(getPaths().api.dist, 'server.js')
  return fs.existsSync(serverFilePath)
}

export const builder = async (yargs) => {
  yargs
    .usage('usage: $0 <side>')
    .command({
      command: '$0',
      description: 'Run both api and web servers',
      builder: (yargs) =>
        yargs.options({
          port: {
            default: getConfig().web?.port || 8910,
            type: 'number',
            alias: 'p',
          },
          socket: { type: 'string' },
        }),
      handler: async (argv) => {
        recordTelemetryAttributes({
          command: 'serve',
          port: argv.port,
          host: argv.host,
          socket: argv.socket,
        })

        // Run the experimental server file, if it exists, with web side also
        if (hasExperimentalServerFile()) {
          const { bothExperimentalServerFileHandler } = await import(
            './serveBothHandler.js'
          )
          await bothExperimentalServerFileHandler()
        } else if (
          getConfig().experimental?.rsc?.enabled ||
          getConfig().experimental?.streamingSsr?.enabled
        ) {
          const { bothSsrRscServerHandler } = await import(
            './serveBothHandler.js'
          )
          await bothSsrRscServerHandler(argv)
        } else {
          // Wanted to use the new web-server package here, but can't because
          // of backwards compatibility reasons. With `bothServerHandler` both
          // the web side and the api side run on the same server with the same
          // port. If we use a separate fe server and api server we can't run
          // them on the same port, and so we lose backwards compatibility.
          // TODO: Use @redwoodjs/web-server when we're ok with breaking
          // backwards compatibility.
          const { bothServerHandler } = await import('./serveBothHandler.js')
          await bothServerHandler(argv)
        }
      },
    })
    .command({
      command: 'api',
      description: 'Start server for serving only the api',
      builder: (yargs) =>
        yargs.options({
          port: {
            default: getConfig().api?.port || 8911,
            type: 'number',
            alias: 'p',
          },
          socket: { type: 'string' },
          apiRootPath: {
            alias: ['api-root-path', 'rootPath', 'root-path'],
            default: '/',
            type: 'string',
            desc: 'Root path where your api functions are served',
            coerce: coerceRootPath,
          },
        }),
      handler: async (argv) => {
        recordTelemetryAttributes({
          command: 'serve',
          port: argv.port,
          host: argv.host,
          socket: argv.socket,
          apiRootPath: argv.apiRootPath,
        })

        // Run the experimental server file, if it exists, api side only
        if (hasExperimentalServerFile()) {
          const { apiExperimentalServerFileHandler } = await import(
            './serveApiHandler.js'
          )
          await apiExperimentalServerFileHandler()
        } else {
          const { apiServerHandler } = await import('./serveApiHandler.js')
          await apiServerHandler(argv)
        }
      },
    })
    .command({
      command: 'web',
      description: 'Start server for serving only the web side',
      builder: (yargs) =>
        yargs.options({
          port: {
            default: getConfig().web?.port || 8910,
            type: 'number',
            alias: 'p',
          },
          socket: { type: 'string' },
          apiHost: {
            alias: 'api-host',
            type: 'string',
            desc: 'Forward requests from the apiUrl, defined in redwood.toml to this host',
          },
        }),
      handler: async (argv) => {
        recordTelemetryAttributes({
          command: 'serve',
          port: argv.port,
          host: argv.host,
          socket: argv.socket,
          apiHost: argv.apiHost,
        })

        if (getConfig().experimental?.streamingSsr?.enabled) {
          await webSsrServerHandler()
        } else {
          await webServerHandler(argv)
        }
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

// We'll clean this up later, but for now note that this function is
// duplicated between this package and @redwoodjs/fastify
// to avoid importing @redwoodjs/fastify when the CLI starts.
export function coerceRootPath(path) {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}
