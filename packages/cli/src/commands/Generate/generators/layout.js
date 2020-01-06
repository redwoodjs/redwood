import path from 'path'

import pascalcase from 'pascalcase'

import { generateTemplate } from 'src/lib'

const OUTPUT_PATH = path.join('web', 'src', 'layouts')

const files = (args) => {
  const [[layoutName, ..._rest], _flags] = args
  const name = pascalcase(layoutName) + 'Layout'
  const outputPath = path.join(OUTPUT_PATH, name, `${name}.js`)
  const template = generateTemplate(path.join('layout', 'layout.js.template'), {
    name,
    path,
  })

  return { [outputPath]: template }
}

export default {
  name: 'Layout',
  command: 'layout',
  description: 'Generates a layout component',
  files: (args) => files(args),
}
