import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import { generateTemplate } from 'src/lib'

const OUTPUT_PATH = path.join('web', 'src', 'cells')

const files = (args) => {
  const [[cellName, ..._rest], _flags] = args
  const name = pascalcase(cellName) + 'Cell'
  const camelName = camelcase(pluralize(cellName))
  const outputPath = path.join(OUTPUT_PATH, name, `${name}.js`)
  const template = generateTemplate(path.join('cell', 'cell.js.template'), {
    name,
    camelName,
  })

  return { [outputPath]: template }
}

export default {
  name: 'Cell',
  command: 'cell',
  description: 'Generates a cell component',
  files: (args) => files(args),
}
