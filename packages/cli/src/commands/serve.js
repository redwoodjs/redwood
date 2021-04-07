import terminalLink from 'terminal-link'

import { cliOptions, handler as apiServerHandler } from '@redwoodjs/api-server'

export const command = 'serve side'
export const description = 'Run server for api in production'

// @NOTE if/when we add more sides
// We might want to structure this like packages/cli/src/redwood-tools.js
// With each side as a command, rather than a side positional
export const builder = (yargs) => {
  yargs
    .options(cliOptions)
    .positional('side', {
      default: 'api',
      description: 'Which server to start',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#run'
      )}`
    )
}

export const handler = async ({ side = 'api', ...otherOptions }) => {
  // Currently we only support api anyway
  // Not sure if we will support web in the future
  if (side === 'api') {
    apiServerHandler(otherOptions)
  }
}
