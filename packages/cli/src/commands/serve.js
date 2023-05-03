import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths, getConfig } from '../lib'
import c from '../lib/colors'
import { isTypeScriptProject } from '../lib/project'

export const command = 'serve [side]'
export const description = 'Run server for api or web in production'

export function coerceRootPath(path) {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}

export const builder = async (yargs) => {
  yargs
    .usage('usage: $0 <side>')
    .command({
      command: '$0',
      descriptions: 'Run both api and web servers',
      handler: async (argv) => {
        const serverFileName = `server.${isTypeScriptProject() ? 'ts' : 'js'}`
        const serverFilePath = path.join(getPaths().api.dist, serverFileName)
        if (fs.existsSync(serverFilePath)) {
          console.log(
            `${chalk.hex('#ff845e')(
              `------------------------------------------------------------------\n 🧪 ${chalk.green(
                'Experimental Feature'
              )} 🧪\n------------------------------------------------------------------`
            )}`
          )
          console.log(
            `Using the experimental API server file: 'api/dist/${serverFileName}'.`
          )
          console.log(
            `${chalk.hex('#ff845e')(
              '------------------------------------------------------------------'
            )}\n`
          )
          await execa('yarn', ['node', path.join('dist', serverFileName)], {
            cwd: getPaths().api.base,
            stdio: 'inherit',
            shell: true,
          })
          return
        }

        const { bothServerHandler } = await import('./serveHandler.js')
        await bothServerHandler(argv)
      },
      builder: (yargs) =>
        yargs.options({
          port: {
            default: getConfig().web?.port || 8910,
            type: 'number',
            alias: 'p',
          },
          socket: { type: 'string' },
        }),
    })
    .command({
      command: 'api',
      description: 'start server for serving only the api',
      handler: async (argv) => {
        const { apiServerHandler } = await import('./serveHandler.js')
        await apiServerHandler(argv)
      },
      builder: (yargs) =>
        yargs.options({
          port: {
            default: getConfig().api?.port || 8911,
            type: 'number',
            alias: 'p',
          },
          socket: { type: 'string' },
          apiRootPath: {
            alias: ['rootPath', 'root-path'],
            default: '/',
            type: 'string',
            desc: 'Root path where your api functions are served',
            coerce: coerceRootPath,
          },
        }),
    })
    .command({
      command: 'web',
      description: 'start server for serving only the web side',
      handler: async (argv) => {
        const { webServerHandler } = await import('./serveHandler.js')
        await webServerHandler(argv)
      },
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
    })
    .middleware((argv) => {
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
