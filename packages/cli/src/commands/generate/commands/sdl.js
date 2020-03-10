import path from 'path'

import Listr from 'listr'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import { generateTemplate, getSchema, getPaths, writeFilesTask } from 'src/lib'
import c from 'src/lib/colors'

import { files as serviceFiles } from './service'

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
    throw new Error('Cannot generate SDL without an `id` database column')
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
    throw new Error(
      `\`${name}"\` model not found, check if it exists in \`./api/prisma/schema.prisma\``
    )
  }
}

export const files = async ({ name, crud }) => {
  const { query, input, idType } = await sdlFromSchemaModel(
    pascalcase(pluralize.singular(name))
  )

  const template = generateTemplate(path.join('sdl', 'sdl.js.template'), {
    name,
    crud,
    query,
    input,
    idType,
  })

  const outputPath = path.join(
    getPaths().api.graphql,
    `${camelcase(pluralize(name))}.sdl.js`
  )
  return { [outputPath]: template }
}

export const command = 'sdl <model>'
export const desc = 'Generate a GraphQL schema and service object.'
export const builder = {
  services: { type: 'boolean', default: true },
  crud: { type: 'boolean', default: false },
  force: { type: 'boolean', default: false },
}
// TODO: Add --dry-run command
export const handler = async ({ model, crud, services, force }) => {
  const tasks = new Listr(
    [
      {
        title: 'Generating SDL files...',
        task: async () => {
          const f = await files({ name: model, crud })
          return writeFilesTask(f, { overwriteExisting: force })
        },
      },
      services && {
        title: 'Generating service files...',
        task: async () => {
          const f = await serviceFiles({ name: model, crud })
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
