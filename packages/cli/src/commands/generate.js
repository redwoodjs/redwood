import terminalLink from 'terminal-link'

import { getProject } from '@redwoodjs/structure'

export const command = 'generate <type>'
export const aliases = ['g']
export const description = 'Save time by generating boilerplate code'

const project = getProject()

export const builder = (yargs) =>
  yargs
    /**
     * Like generate, util is an entry point command,
     * so we can't have generate going through its subdirectories
     */
    .commandDir('./generate', { recurse: true, exclude: /\/util\// })
    .demandCommand()
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-alias-g'
      )}`
    )

/** @type {Record<string, import('yargs').Options>} */
export const yargsDefaults = {
  force: {
    alias: 'f',
    default: false,
    description: 'Overwrite existing files',
    type: 'boolean',
  },
  typescript: {
    alias: 'ts',
    default: project.isTypeScriptProject,
    description:
      'Generate TypeScript files. Enabled by default if we detect your project is typescript',
    type: 'boolean',
  },
}
