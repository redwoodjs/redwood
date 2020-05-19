import path from 'path'

import camelcase from 'camelcase'
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

export const desc = 'Generate a function'

export const builder = {
  force: { type: 'boolean', default: false },
}

export const { command, handler } = createYargsForComponentGeneration({
  componentName: 'function',
  filesFn: files,
})
