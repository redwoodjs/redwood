import path from 'path'

import pascalcase from 'pascalcase'
import { getPaths } from '@redwoodjs/core'

import { generateTemplate } from 'src/lib'

const files = (args) => {
  const [[name, ..._rest], _flags] = args
  const filename = pascalcase(name) + 'Cell'
  const outputPath = path.join(
    getPaths().web.components,
    filename,
    `${filename}.js`
  )
  const template = generateTemplate(path.join('cell', 'cell.js.template'), {
    name,
  })

  return { [outputPath]: template }
}

export default {
  name: 'Cell',
  command: 'cell',
  description: 'Generates a cell component',
  files: (args) => files(args),
}
