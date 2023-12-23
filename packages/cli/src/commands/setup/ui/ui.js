import terminalLink from 'terminal-link'

import * as chakraUICommand from './libraries/chakra-ui'
import * as mantineCommand from './libraries/mantine'
import * as tailwindCSSCommand from './libraries/tailwindcss'

export const command = 'ui <library>'
export const description = 'Set up a UI design or style library'

export function builder(yargs) {
  yargs
    .command(chakraUICommand)
    .command(mantineCommand)
    .command(tailwindCSSCommand)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-ui'
      )}`
    )
}
