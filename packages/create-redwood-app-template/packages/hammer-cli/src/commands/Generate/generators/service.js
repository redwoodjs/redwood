import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import { generateTemplate } from 'src/lib'

const OUTPUT_PATH = path.join('api', 'src', 'services')

const files = ([serviceName, ..._rest]) => {
  const name = pascalcase(pluralize(serviceName))
  const camelName = camelcase(name)
  const outputPath = path.join(OUTPUT_PATH, `${camelName}.js`)
  const template = generateTemplate(
    path.join('service', 'service.js.template'),
    { name, camelName }
  )

  return { [outputPath]: template }
}

export default {
  name: 'Service',
  command: 'service',
  description: 'Generates a Hammer service object',
  files: (args) => files(args),
}
