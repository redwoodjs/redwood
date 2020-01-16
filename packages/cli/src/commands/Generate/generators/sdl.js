import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { getDMMF } from '@prisma/sdk'
import { getPaths } from '@redwoodjs/core'

import { readFile, generateTemplate } from 'src/lib'

const SCHEMA_PATH = path.join('api', 'prisma', 'schema.prisma')
const IGNORE_FIELDS = ['id', 'createdAt']

const modelFieldToSDL = (field, required = true) => {
  return `${field.name}: ${field.type}${
    field.isRequired && required ? '!' : ''
  }`
}

const querySDL = (fields) => {
  return fields.map((field) => modelFieldToSDL(field))
}

const inputSDL = (fields) => {
  return fields
    .filter((field) => {
      return IGNORE_FIELDS.indexOf(field.name) === -1
    })
    .map((field) => modelFieldToSDL(field, false))
}

const sdlFromSchemaModel = async (name) => {
  const metadata = await getDMMF({
    datamodel: readFile(SCHEMA_PATH).toString(),
  })

  const model = metadata.datamodel.models.find((model) => {
    return model.name === name
  })

  if (model) {
    return {
      query: querySDL(model.fields).join('\n    '),
      input: inputSDL(model.fields).join('\n    '),
    }
  } else {
    throw `no schema definition found for \`${name}\``
  }
}

const files = async (args) => {
  const [[name, ...rest], flags] = args
  const outputPath = path.join(
    getPaths().api.graphql,
    `${camelcase(pluralize(name))}.sdl.js`
  )
  const isCrud = !!flags['crud']
  const { query, input } = await sdlFromSchemaModel(
    pascalcase(pluralize.singular(name))
  )
  const template = generateTemplate(path.join('sdl', 'sdl.js.template'), {
    name,
    isCrud,
    query,
    input,
  })

  return { [outputPath]: template }
}

// also create a service for the SDL to automap to resolvers
const generate = (args) => {
  return [[['service', ...args[0]], args[1]]]
}

export default {
  name: 'SDL',
  command: 'sdl',
  description: 'Generates a GraphQL SDL file and service object',
  files: async (args) => await files(args),
  generate: (args) => generate(args),
}
