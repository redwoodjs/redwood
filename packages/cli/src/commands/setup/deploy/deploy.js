import terminalLink from 'terminal-link'

import * as baremetalCommand from './providers/baremetal'
import * as coherenceCommand from './providers/coherence'
import * as flightcontrolCommand from './providers/flightcontrol'
import * as netlifyCommand from './providers/netlify'
import * as renderCommand from './providers/render'
import * as vercelCommand from './providers/vercel'

export const command = 'deploy <target>'
export const description = 'Setup deployment to various targets'

export function builder(yargs) {
  yargs
    .command(baremetalCommand)
    .command(coherenceCommand)
    .command(flightcontrolCommand)
    .command(netlifyCommand)
    .command(renderCommand)
    .command(vercelCommand)
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing configuration',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#setup-deploy-config'
      )}`
    )
}
