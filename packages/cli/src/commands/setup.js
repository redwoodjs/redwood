import terminalLink from 'terminal-link'

import detectRwVersion from '../middleware/detectProjectRwVersion'

export const command = 'setup <command>'
export const description = 'Initialize project config and install packages'

const setupAuthAuth0Command = await import(
  '@redwoodjs/auth-providers/dist/auth0/setup'
)
// const setupAuthAzureActiveDirectory = await import()

export const builder = (yargs) =>
  yargs
    .demandCommand()
    .middleware(detectRwVersion)
    .command(setupAuthAuth0Command)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup'
      )}`
    )
