import path from 'path'

import camelcase from 'camelcase'
import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'

import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

export const files = async ({ name, ...rest }) => {
  const functionName = camelcase(name)
  const file = templateForComponentFile({
    name: functionName,
    componentName: functionName,
    apiPathSection: 'functions',
    generator: 'function',
    templatePath: 'function.js.template',
    templateVars: { ...rest },
    outputPath: path.join(getPaths().api.functions, `${functionName}.js`),
  })

  return { [file[0]]: file[1] }
}

export const description = 'Generate a Function'

export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'Name of the Function',
      type: 'string',
    })
    .option('force', {
      alias: 'f',
      default: false,
      description: 'Overwrite existing files',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-function'
      )}`
    )
}

export const { command, handler } = createYargsForComponentGeneration({
  componentName: 'function',
  filesFn: files,
})
