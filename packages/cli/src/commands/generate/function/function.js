import path from 'path'

import camelcase from 'camelcase'
import terminalLink from 'terminal-link'

import { getPaths, transformTSToJS } from 'src/lib'

import { yargsDefaults } from '../../generate'
import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

export const files = ({ name, ...rest }) => {
  // Taken from ../component; should be updated to take from the project's configuration
  const isJavascript = rest.javascript && !rest.typescript
  const extension = isJavascript ? '.js' : '.ts'

  const functionName = camelcase(name)
  const file = templateForComponentFile({
    name: functionName,
    componentName: functionName,
    extension: extension,
    apiPathSection: 'functions',
    generator: 'function',
    templatePath: 'function.ts.template',
    templateVars: { ...rest },
    outputPath: path.join(
      getPaths().api.functions,
      `${functionName}${extension}`
    ),
  })

  const template = isJavascript ? transformTSToJS(file[0], file[1]) : file[1]

  return { [file[0]]: template }
}

export const description = 'Generate a Function'

// This could be built using createYargsForComponentGeneration;
// however, functions wouldn't have a `stories` option. createYargs...
// should be reversed to provide `yargsDefaults` as the default configuration
// and accept a configuration such as its CURRENT default to append onto a command.
export const builder = (yargs) => {
  yargs
    .positional('name', {
      description: 'Name of the Function',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-function'
      )}`
    )
  // Add default options, includes '--typescript', '--javascript', '--force', ...
  Object.entries(yargsDefaults).forEach(([option, config]) => {
    yargs.option(option, config)
  })
}

export const { command, handler } = createYargsForComponentGeneration({
  componentName: 'function',
  filesFn: files,
})
