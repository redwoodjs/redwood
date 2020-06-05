import execa from 'execa'
import { getConfig } from '@redwoodjs/internal'
import terminalLink from 'terminal-link'

export const command = 'open'
export const description = 'Open your project in your browser'
export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/reference/command-line-interface#open'
    )}`
  )
}
export const handler = () => {
  execa(`open http://localhost:${getConfig().web.port}`, { shell: true })
}
