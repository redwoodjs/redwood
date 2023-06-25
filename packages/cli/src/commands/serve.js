import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import execa from 'execa'
import terminalLink from 'terminal-link'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

import { getPaths, getConfig } from '../lib'
import c from '../lib/colors'

export const command = 'serve [side]'
export const description = 'Run server for api or web in production'

function hasExperimentalServerFile() {
  const serverFilePath = path.join(getPaths().api.dist, 'server.js')
  return fs.existsSync(serverFilePath)
}

const streamServerErrorHandler = () => {
  console.error('⚠️  Experimental Render Mode ~ Cannot serve the web side ⚠️')
  console.log('~'.repeat(50))
  console.log()
  console.log()
  console.log('You can run the new frontend server with: `yarn rw-serve-fe`')
  console.log('You can run the api server with: yarn rw serve api')
  console.log()
  console.log()
  console.log('~'.repeat(50))

  throw new Error(
    'You will need to run the FE server and API server separately.'
  )
}

export const builder = async (yargs) => {
  const redwoodProjectPaths = getPaths()
  const redwoodProjectConfig = getConfig()

  const { apiCliOptions, webCliOptions, commonOptions, apiServerHandler } =
    await import('@redwoodjs/api-server')

  yargs
    .usage('usage: $0 <side>')
    .command({
      command: '$0',
      descriptions: 'Run both api and web servers',
      handler: streamServerErrorHandler,
      builder: (yargs) => yargs.options(commonOptions),
    })
    .command({
      command: 'both',
      description: 'Run both api and web servers. Uses the web port and host',
      builder: (yargs) =>
        yargs.options({
          port: {
            default: redwoodProjectConfig.web.port,
            type: 'number',
            alias: 'p',
          },
          host: {
            default: redwoodProjectConfig.web.host,
            type: 'string',
          },
          socket: { type: 'string' },
        }),
      handler: async (argv) => {
        recordTelemetryAttributes({
          command,
          port: argv.port,
          host: argv.host,
          socket: argv.socket,
        })

        // Run the experimental server file, if it exists, with web side also
        if (hasExperimentalServerFile()) {
          console.log(
            [
              separator,
              `🧪 ${chalk.green('Experimental Feature')} 🧪`,
              separator,
              'Using the experimental API server file at api/dist/server.js',
              separator,
            ].join('\n')
          )
          await execa(
            'yarn',
            ['node', path.join('dist', 'server.js'), '--enable-web'],
            {
              cwd: redwoodProjectPaths.api.base,
              stdio: 'inherit',
              shell: true,
            }
          )
          return
        }

        const { bothServerHandler } = await import('./serveHandler.js')
        await bothServerHandler(argv)
      },
    })
    .command({
      command: 'api',
      description: 'start server for serving only the api',
      handler: apiServerHandler,
      builder: (yargs) => yargs.options(apiCliOptions),
    })
    .command({
      command: 'web',
      description: 'start server for serving only the web side',
      handler: streamServerErrorHandler,
      builder: (yargs) => yargs.options(webCliOptions),
    })
    .middleware((argv) => {
      // Make sure the relevant side has been built, before serving
      const positionalArgs = argv._

      if (
        positionalArgs.includes('web') &&
        !fs.existsSync(path.join(redwoodProjectPaths.web.dist), 'index.html')
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
        !fs.existsSync(path.join(redwoodProjectPaths.api.dist))
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
        (!fs.existsSync(path.join(redwoodProjectPaths.api.dist)) ||
          !fs.existsSync(path.join(redwoodProjectPaths.web.dist), 'index.html'))
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

const separator = chalk.hex('#ff845e')(
  '------------------------------------------------------------------'
)

// We'll clean this up later, but for now note that this function is
// duplicated between this package and @redwoodjs/fastify
// to avoid importing @redwoodjs/fastify when the CLI starts.
export function coerceRootPath(path) {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}
