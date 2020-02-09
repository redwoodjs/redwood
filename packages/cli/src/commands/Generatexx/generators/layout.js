import path from 'path'

import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { getPaths } from '@redwoodjs/core'

import { generateTemplate } from 'src/lib'

const files = (args) => {
  const [[name, ..._rest], _flags] = args
  const filename = pascalcase(pluralize.singular(name)) + 'Layout'
  const outputPath = path.join(
    getPaths().web.layouts,
    filename,
    `${filename}.js`
  )
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
