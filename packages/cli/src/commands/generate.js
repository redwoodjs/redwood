export const command = 'generate <type>'
export const aliases = ['g']
export const description = 'Save time by generating boilerplate code'
import terminalLink from 'terminal-link'

export const builder = (yargs) =>
  yargs
    .commandDir('./generate', { recurse: true })
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
  javascript: {
    alias: 'js',
    default: true,
    description: 'Generate JavaScript files',
    type: 'boolean',
  },
  typescript: {
    alias: 'ts',
    default: false,
    description: 'Generate TypeScript files',
    type: 'boolean',
  },
}
