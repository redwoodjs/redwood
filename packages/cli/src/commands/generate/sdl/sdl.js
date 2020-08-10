import path from 'path'

import Listr from 'listr'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import terminalLink from 'terminal-link'

import {
  generateTemplate,
  transformTSToJS,
  getSchema,
  getPaths,
  writeFilesTask,
  getEnum,
} from 'src/lib'
import c from 'src/lib/colors'

import { yargsDefaults } from '../../generate'
import { files as serviceFiles } from '../service/service'
import { relationsForModel } from '../helpers'

const IGNORE_FIELDS_FOR_INPUT = ['id', 'createdAt', 'updatedAt']

const modelFieldToSDL = (field, required = true, types = {}) => {
  if (Object.entries(types).length) {
    field.type =
      field.kind === 'object' ? idType(types[field.type]) : field.type
  }

  const dictionary = {
    Json: 'JSON',
  }

  return `${field.name}: ${field.isList ? '[' : ''}${
    dictionary[field.type] || field.type
  }${field.isList ? ']' : ''}${
    (field.isRequired && required) | field.isList ? '!' : ''
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

    // Get enum definition and fields from user-defined types
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

export const files = async ({ name, crud, typescript, javascript }) => {
  const {
    query,
    createInput,
    updateInput,
    idType,
    relations,
    enums,
  } = await sdlFromSchemaModel(pascalcase(pluralize.singular(name)))

  let template = generateTemplate(
    path.join('sdl', 'templates', `sdl.ts.template`),
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

  const extension = typescript === true ? 'ts' : 'js'
  let outputPath = path.join(
    getPaths().api.graphql,
    `${camelcase(pluralize(name))}.sdl.${extension}`
  )

  if (javascript && !typescript) {
    template = transformTSToJS(outputPath, template)
  }

  return {
    [outputPath]: template,
    ...(await serviceFiles({ name, crud, relations, typescript, javascript })),
  }
}

export const defaults = {
  ...yargsDefaults,
  crud: {
    default: false,
    description: 'Also generate mutations',
    type: 'boolean',
  },
}

export const command = 'sdl <model>'
export const description =
  'Generate a GraphQL schema and service component based on a given DB schema Model'
export const builder = (yargs) => {
  yargs
    .positional('model', {
      description: 'Model to generate the sdl for',
      type: 'string',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-sdl'
      )}`
    )
  Object.entries(defaults).forEach(([option, config]) => {
    yargs.option(option, config)
  })
}
// TODO: Add --dry-run command
export const handler = async ({
  model,
  crud,
  force,
  typescript,
  javascript,
}) => {
  const tasks = new Listr(
    [
      {
        title: 'Generating SDL files...',
        task: async () => {
          const f = await files({ name: model, crud, typescript, javascript })
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
