// inspired by gatsby/packages/gatsby-cli/src/create-cli.js and
// and gridsome/packages/cli/lib/commands/info.js
import envinfo from 'envinfo'
import terminalLink from 'terminal-link'

import { recordTelemetryAttributes } from '@redwoodjs/cli-helpers'

export const command = 'info'
export const description = 'Print your system environment information'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/docs/cli-commands#info'
    )}`
  )
}
export const handler = async () => {
  recordTelemetryAttributes({
    command: 'info',
  })
  const output = await envinfo.run({
    System: ['OS', 'Shell'],
    Binaries: ['Node', 'Yarn'],
    Browsers: ['Chrome', 'Edge', 'Firefox', 'Safari'],
    // yarn workspaces not supported :-/
    npmPackages: '@redwoodjs/*',
    Databases: ['SQLite'],
  })
  console.log(output)
}
