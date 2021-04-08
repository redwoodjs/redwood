import terminalLink from 'terminal-link'

import {
  apiCliOptions,
  webCliOptions,
  bothCliOptions,
  apiServerHandler,
  webServerHandler,
  bothServerHandler,
} from '@redwoodjs/api-server'

export const command = 'serve [side]'
export const description = 'Run server for api or web in production'

export const builder = (yargs) => {
  yargs
    .usage('usage: $0 <side>')
    .command({
      command: '$0',
      descriptions: 'Run both api and web servers',
      handler: bothServerHandler,
      builder: (yargs) => yargs.options(bothCliOptions),
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
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#serve'
      )}`
    )
}
