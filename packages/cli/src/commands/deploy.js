import terminalLink from 'terminal-link'

import * as baremetalCommand from './deploy/baremetal'
import * as flightcontrolCommand from './deploy/flightcontrol'
import * as netlifyCommand from './deploy/netlify'
import * as renderCommand from './deploy/render'
import * as vercelCommand from './deploy/vercel'

export const command = 'deploy <target>'
export const description = 'Deploy your Redwood project'

export function builder(yargs) {
  yargs
    .command(baremetalCommand)
    .command(flightcontrolCommand)
    .command(netlifyCommand)
    .command(renderCommand)
    .command(vercelCommand)
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#deploy'
      )}\n`
    )
}
