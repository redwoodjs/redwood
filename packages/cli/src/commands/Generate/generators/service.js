import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import { generateTemplate } from 'src/lib'

const OUTPUT_PATH = path.join('api', 'src', 'services')

const files = (args) => {
  const [[serviceName, ..._rest], flags] = args
  const singularName = pascalcase(serviceName)
  const pluralName = pluralize(singularName)
  const singularCamelName = camelcase(singularName)
  const pluralCamelName = camelcase(pluralName)
  const outputPath = path.join(OUTPUT_PATH, `${pluralCamelName}.js`)
  const isCrud = !!flags['crud']
  const template = generateTemplate(
    path.join('service', 'service.js.template'),
    { singularName, pluralName, singularCamelName, pluralCamelName, isCrud }
  )

  return { [outputPath]: template }
}

export default {
  name: 'Service',
  command: 'service',
  description: 'Generates a service object',
  files: (args) => files(args),
}
