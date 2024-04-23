import terminalLink from 'terminal-link'
import type { Argv } from 'yargs'

import * as fragmentsCommand from './ogImage/ogImage'

export const command = 'middleware <type>'
export const description = 'Set up a middleware'
export function builder(yargs: Argv) {
  return yargs
    .command(fragmentsCommand)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-middleware',
      )}`,
    )
}
