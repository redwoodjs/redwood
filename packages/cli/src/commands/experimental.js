import terminalLink from 'terminal-link'

import detectRwVersion from '../middleware/detectProjectRwVersion'

import * as setupDockerCommand from './experimental/setupDocker'
import * as setupInngestCommand from './experimental/setupInngest'
import * as setupOpentelementryCommand from './experimental/setupOpentelemetry'
import * as setupRscCommand from './experimental/setupRsc'
import * as setupSentryCommand from './experimental/setupSentry'
import * as setupServerFileCommand from './experimental/setupServerFile'
import * as setupStreamingSsrCommand from './experimental/setupStreamingSsr'
import * as studioCommand from './experimental/studio'

export const command = 'experimental <command>'
export const aliases = ['exp']
export const description = 'Run or setup experimental features'

export function builder(yargs) {
  yargs
    .command(setupDockerCommand)
    .command(setupInngestCommand)
    .command(setupOpentelementryCommand)
    .command(setupRscCommand)
    .command(setupSentryCommand)
    .command(setupServerFileCommand)
    .command(setupStreamingSsrCommand)
    .command(studioCommand)
    .middleware(detectRwVersion)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#experimental'
      )}`
    )
}
