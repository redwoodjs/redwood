import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { getPaths } from '@redwoodjs/core'

import { generateTemplate, getSchema } from 'src/lib'

const IGNORE_FIELDS = ['id', 'createdAt']

const modelFieldToSDL = (field, required = true) => {
  return `${field.name}: ${field.type}${
    field.isRequired && required ? '!' : ''
  }`
}

const querySDL = (model) => {
  return model.fields.map((field) => modelFieldToSDL(field))
}

const inputSDL = (model) => {
  return model.fields
    .filter((field) => {
      return IGNORE_FIELDS.indexOf(field.name) === -1
    })
    .map((field) => modelFieldToSDL(field, false))
}

const idType = (model) => {
  const idField = model.fields.find((field) => field.name === 'id')
  if (!idField) {
    throw 'Cannot generate SDL without an `id` database column'
  }
  return idField.type
}

const sdlFromSchemaModel = async (name) => {
  const model = await getSchema(name)

  if (model) {
    return {
      query: querySDL(model).join('\n    '),
      input: inputSDL(model).join('\n    '),
      idType: idType(model),
    }
  } else {
    throw `No schema definition found for \`${name}\``
  }
}

const files = async (args) => {
  const [[name, ...rest], flags] = args
  const outputPath = path.join(
    getPaths().api.graphql,
    `${camelcase(pluralize(name))}.sdl.js`
  )
  const isCrud = !!flags['crud']
  const { query, input, idType } = await sdlFromSchemaModel(
    pascalcase(pluralize.singular(name))
  )
  const template = generateTemplate(path.join('sdl', 'sdl.js.template'), {
    name,
    isCrud,
    query,
    input,
    idType,
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
