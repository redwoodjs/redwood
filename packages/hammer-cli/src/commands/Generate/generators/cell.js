import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import { generateTemplate } from 'src/lib'

const OUTPUT_PATH = path.join('web', 'src', 'cells')

const files = ([pageName, ..._rest]) => {
  const name = pascalcase(pageName) + 'Cell'
  const camelName = camelcase(pluralize(pageName))
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
  description: 'Generates a Hammer cell component',
  files: (args) => files(args),
}
