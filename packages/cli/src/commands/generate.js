import terminalLink from 'terminal-link'

import { getPaths, generateTypeDefs } from '@redwoodjs/internal'
import { getProject } from '@redwoodjs/structure'

import c from 'src/lib/colors'

export const command = 'generate <type>'
export const aliases = ['g']
export const description = 'Generate boilerplate code and type definitions'

export const builder = (yargs) =>
  yargs
    .command('types', 'Generate TypeScript definitions', {}, function () {
      const rwjsPaths = getPaths()
      console.log()
      console.log(c.bold('Generating...'))
      const files = generateTypeDefs()
      for (const f of files) {
        console.log('  -', f.replace(rwjsPaths.base, '').substring(1))
      }
      console.log('... and done.')
    })
    /**
     * Like generate, util is an entry point command,
     * so we can't have generate going through its subdirectories.
     * NOTE: `util` is deprecated.
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
    default: getProject().isTypeScriptProject,
    description: 'Generate TypeScript files',
    type: 'boolean',
  },
}
