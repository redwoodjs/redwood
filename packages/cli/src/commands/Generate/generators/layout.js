import path from 'path'

import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import { generateTemplate } from 'src/lib'

const OUTPUT_PATH = path.join('web', 'src', 'layouts')

const files = (args) => {
  const [[name, ..._rest], _flags] = args
  const filename = pascalcase(pluralize.singular(name)) + 'Layout'
  const outputPath = path.join(OUTPUT_PATH, filename, `${filename}.js`)
  const template = generateTemplate(path.join('layout', 'layout.js.template'), {
    name,
  })

  return { [outputPath]: template }
}

export default {
  name: 'Layout',
  command: 'layout',
  description: 'Generates a layout component',
  files: (args) => files(args),
}
