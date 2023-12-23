import terminalLink from 'terminal-link'

import * as initCommand from './record/init'

export const command = 'record <command>'
export const description = 'Set up RedwoodRecord for your project'

export function builder(yargs) {
  yargs
    .command(initCommand)
    .epilogue(
      `Also see the ${terminalLink(
        'RedwoodRecord Docs',
        'https://redwoodjs.com/docs/redwoodrecord'
      )}\n`
    )
}
