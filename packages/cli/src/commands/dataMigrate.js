import terminalLink from 'terminal-link'

import * as installCommand from './dataMigrate/install'
import * as upCommand from './dataMigrate/up'

export const command = 'data-migrate <command>'
export const aliases = ['dm', 'dataMigrate']
export const description = 'Migrate the data in your database'

export function builder(yargs) {
  yargs
    .command(installCommand)
    .command(upCommand)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#datamigrate'
      )}`
    )
}
