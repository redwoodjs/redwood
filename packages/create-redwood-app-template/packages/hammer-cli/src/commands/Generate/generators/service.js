import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import path from 'path'
import pluralize from 'pluralize'
import { generateTemplate } from 'src/lib'

const files = ([serviceName, ...rest]) => {
  const name = pascalcase(pluralize(serviceName))
  const camelName = camelcase(name)
  const outputPath = path.join('services', `${name}.js`)
  const template = generateTemplate(
    path.join('service', 'service.js.template'),
    { name, camelName }
  )

  return { [outputPath]: template }
}

export default {
  name: 'Service',
  command: 'service',
  description: 'Generates a Hammer service file',
  files: args => files(args)
}
