import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import path from 'path'
import pluralize from 'pluralize'
import { generateTemplate } from 'src/lib'

const files = ([pageName, ...rest]) => {
  const name = pascalcase(pageName) + 'Cell'
  const camelName = camelcase(pluralize(pageName))
  const outputPath = path.join('cells', name, `${name}.js`)
  const template = generateTemplate(
    path.join('cell', 'cell.js.template'),
    { name, camelName }
  )

  return { [outputPath]: template }
}

export default {
  name: 'Cell',
  command: 'cell',
  description: 'Generates a Hammer cell component',
  files: args => files(args),
}
