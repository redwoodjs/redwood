import fs from 'fs'
import path from 'path'

import terminalLink from 'terminal-link'

import {
  apiCliOptions,
  webCliOptions,
  commonOptions,
  apiServerHandler,
  webServerHandler,
  bothServerHandler,
} from '@redwoodjs/api-server'
import { getPaths } from '@redwoodjs/internal'

import c from '../lib/colors'

export const command = 'serve [side]'
export const description = 'Run server for api or web in production'

export const builder = (yargs) => {
  yargs
    .usage('usage: $0 <side>')
    .command({
      command: '$0',
      descriptions: 'Run both api and web servers',
      handler: bothServerHandler,
      builder: (yargs) => yargs.options(commonOptions),
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
      handler: webServerHandler,
      builder: (yargs) => yargs.options(webCliOptions),
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
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#serve'
      )}`
    )
}
