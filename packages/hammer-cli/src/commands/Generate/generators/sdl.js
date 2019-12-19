import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import { generateTemplate } from 'src/lib'

const OUTPUT_PATH = path.join('api', 'src', 'graphql')

const files = ([sdlName, ...rest]) => {
  const typeName = pascalcase(sdlName)
  const serviceName = pluralize(typeName)
  const serviceFileName = camelcase(serviceName)
  const queryAllName = camelcase(serviceName)
  const outputPath = path.join(OUTPUT_PATH, `${serviceFileName}.sdl.js`)
  const querySDL = 'QUERY'
  const inputSDL = 'INPUT'
  const template = generateTemplate(path.join('sdl', 'sdl.js.template'), {
    typeName,
    serviceName,
    serviceFileName,
    queryAllName,
    querySDL,
    inputSDL,
  })

  return { [outputPath]: template }
}

// also create a service for the SDL to automap to resolvers
const generate = (args) => {
  return [['service', ...args]]
}

export default {
  name: 'SDL',
  command: 'sdl',
  description: 'Generates a GraphQL SDL file',
  files: (args) => files(args),
  generate: (args) => generate(args),
}
