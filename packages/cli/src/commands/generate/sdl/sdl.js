import path from 'path'

import boxen from 'boxen'
import camelcase from 'camelcase'
import chalk from 'chalk'
import Listr from 'listr'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import terminalLink from 'terminal-link'

import { getConfig } from '@redwoodjs/internal'

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
import { ensureUniquePlural, relationsForModel } from '../helpers'
import { files as serviceFiles } from '../service/service'

const IGNORE_FIELDS_FOR_INPUT = ['id', 'createdAt', 'updatedAt']

const missingIdConsoleMessage = () => {
  const line1 =
    chalk.bold.yellow('WARNING') +
    ': Cannot generate CRUD SDL without an `@id` database column.'
  const line2 = 'If you are trying to generate for a many-to-many join table '
  const line3 = "you'll need to update your schema definition to include"
  const line4 = 'an `@id` column. Read more here: '
  const line5 = chalk.underline.blue(
    'https://redwoodjs.com/docs/schema-relations'
  )

  console.error(
    boxen(line1 + '\n\n' + line2 + '\n' + line3 + '\n' + line4 + '\n' + line5, {
      padding: 1,
      margin: { top: 1, bottom: 3, right: 1, left: 2 },
      borderStyle: 'single',
    })
  )
}

const modelFieldToSDL = (field, required = true, types = {}) => {
  if (Object.entries(types).length) {
    field.type =
      field.kind === 'object' ? idType(types[field.type]) : field.type
  }

  const dictionary = {
    Json: 'JSON',
    Decimal: 'Float',
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

const idType = (model, crud) => {
  if (!crud) {
    return undefined
  }

  const idField = model.fields.find((field) => field.isId)
  if (!idField) {
    missingIdConsoleMessage()
    throw new Error('Failed: Could not generate SDL')
  }
  return idField.type
}

const sdlFromSchemaModel = async (name, crud) => {
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
      idType: idType(model, crud),
      relations: relationsForModel(model),
      enums,
    }
  } else {
    throw new Error(
      `"${name}" model not found, check if it exists in "./api/prisma/schema.prisma"`
    )
  }
}

export const files = async ({ name, crud, tests, typescript }) => {
  const { query, createInput, updateInput, idType, relations, enums } =
    await sdlFromSchemaModel(pascalcase(pluralize.singular(name)), crud)

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

  const extension = typescript ? 'ts' : 'js'
  let outputPath = path.join(
    getPaths().api.graphql,
    `${camelcase(pluralize(name))}.sdl.${extension}`
  )

  if (typescript) {
    template = transformTSToJS(outputPath, template)
  }

  return {
    [outputPath]: template,
    ...(await serviceFiles({ name, crud, tests, relations, typescript })),
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
    .option('tests', {
      description: 'Generate test files',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-sdl'
      )}`
    )

  // Merge default options in
  Object.entries(defaults).forEach(([option, config]) => {
    yargs.option(option, config)
  })
}
// TODO: Add --dry-run command
export const handler = async ({ model, crud, force, tests, typescript }) => {
  if (tests === undefined) {
    tests = getConfig().generate.tests
  }
  const tasks = new Listr(
    [
      {
        title: 'Generating SDL files...',
        task: async () => {
          const f = await files({ name: model, tests, crud, typescript })
          return writeFilesTask(f, { overwriteExisting: force })
        },
      },
    ].filter(Boolean),
    { collapse: false, exitOnError: true }
  )

  try {
    await ensureUniquePlural({ model })
    await tasks.run()
  } catch (e) {
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
