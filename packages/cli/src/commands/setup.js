export const command = 'setup <type>'
export const aliases = ['g']
export const description = 'Execute some setup logic'
import terminalLink from 'terminal-link'

export const builder = (yargs) =>
  yargs
    .commandDir('./setup', { recurse: true })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-alias-g'
      )}`
    )

export const yargsDefaults = {
  force: {
    alias: 'f',
    default: false,
    description: 'Overwrite existing files',
    type: 'boolean',
  },
}
