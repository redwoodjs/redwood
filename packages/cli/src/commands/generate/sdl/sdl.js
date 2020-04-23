import path from 'path'

import Listr from 'listr'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import {
  generateTemplate,
  getSchema,
  getPaths,
  writeFilesTask,
  getEnum,
} from 'src/lib'
import c from 'src/lib/colors'

import { files as serviceFiles } from '../service/service'
import { relationsForModel } from '../helpers'

const IGNORE_FIELDS_FOR_INPUT = ['id', 'createdAt']

const modelFieldToSDL = (field, required = true, types = {}) => {
  if (Object.entries(types).length) {
    field.type =
      field.kind === 'object' ? idType(types[field.type]) : field.type
  }
  return `${field.name}: ${field.type}${
    field.isRequired && required ? '!' : ''
  }`
}

const querySDL = (model) => {
  return model.fields.map((field) => modelFieldToSDL(field))
}

const inputSDL = (model, required, types = {}) => {
  return model.fields
    .filter((field) => {
      return (
        IGNORE_FIELDS_FOR_INPUT.indexOf(field.name) === -1 &&
        field.kind !== 'object'
      )
    })
    .map((field) => modelFieldToSDL(field, required, types))
}

// creates the CreateInput type (all fields are required)
const createInputSDL = (model, types = {}) => {
  return inputSDL(model, true, types)
}

// creates the UpdateInput type (not all fields are required)
const updateInputSDL = (model, types = {}) => {
  return inputSDL(model, false, types)
}

const idType = (model) => {
  const idField = model.fields.find((field) => field.isId)
  if (!idField) {
    throw new Error('Cannot generate SDL without an `id` database column')
  }
  return idField.type
}

const sdlFromSchemaModel = async (name) => {
  const model = await getSchema(name)

  if (model) {
    // get models for user-defined types referenced
    const types = (
      await Promise.all(
        model.fields
          .filter((field) => field.kind === 'object')
          .map(async (field) => {
            const model = await getSchema(field.type)
            return model
          })
      )
    ).reduce((acc, cur) => ({ ...acc, [cur.name]: cur }), {})

    // Get enum definiton and fields from user-defined types
    const enums = (
      await Promise.all(
        model.fields
          .filter((field) => field.kind === 'enum')
          .map(async (field) => {
            const enumDef = await getEnum(field.type)
            return enumDef
          })
      )
    ).reduce((acc, curr) => acc.concat(curr), [])

    return {
      query: querySDL(model).join('\n    '),
      createInput: createInputSDL(model, types).join('\n    '),
      updateInput: updateInputSDL(model, types).join('\n    '),
      idType: idType(model),
      relations: relationsForModel(model),
      enums,
    }
  } else {
    throw new Error(
      `"${name}" model not found, check if it exists in "./api/prisma/schema.prisma"`
    )
  }
}

export const files = async ({ name, crud }) => {
  const {
    query,
    createInput,
    updateInput,
    idType,
    relations,
    enums,
  } = await sdlFromSchemaModel(pascalcase(pluralize.singular(name)))

  const template = generateTemplate(
    path.join('sdl', 'templates', 'sdl.js.template'),
    {
      name,
      crud,
      query,
      createInput,
      updateInput,
      idType,
      enums,
    }
  )

  const outputPath = path.join(
    getPaths().api.graphql,
    `${camelcase(pluralize(name))}.sdl.js`
  )
  return {
    [outputPath]: template,
    ...(await serviceFiles({ name, crud, relations })),
  }
}

export const command = 'sdl <model>'
export const desc = 'Generate a GraphQL schema and service object.'
export const builder = {
  services: { type: 'boolean', default: true },
  crud: { type: 'boolean', default: false },
  force: { type: 'boolean', default: false },
}
// TODO: Add --dry-run command
export const handler = async ({ model, crud, force }) => {
  const tasks = new Listr(
    [
      {
        title: 'Generating SDL files...',
        task: async () => {
          const f = await files({ name: model, crud })
          return writeFilesTask(f, { overwriteExisting: force })
        },
      },
    ].filter(Boolean),
    { collapse: false, exitOnError: true }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
