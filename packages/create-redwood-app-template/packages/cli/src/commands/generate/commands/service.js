import path from 'path'

import camelcase from 'camelcase'
import pluralize from 'pluralize'
import { getPaths } from '@redwoodjs/core'

import { generateTemplate } from 'src/lib'

const files = (args) => {
  const [[name, ..._rest], flags] = args
  const outputPath = path.join(
    getPaths().api.services,
    `${camelcase(pluralize(name))}.js`
  )
  const isCrud = !!flags['crud']
  const template = generateTemplate(
    path.join('service', 'service.js.template'),
    { name, isCrud }
  )

  return { [outputPath]: template }
}

export default {
  name: 'Service',
  command: 'service',
  description: 'Generates a service object',
  files: (args) => files(args),
}
