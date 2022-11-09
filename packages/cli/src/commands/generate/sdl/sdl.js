import path from 'path'

import boxen from 'boxen'
import camelcase from 'camelcase'
import chalk from 'chalk'
import { Listr } from 'listr2'
import terminalLink from 'terminal-link'

import { getConfig } from '@redwoodjs/internal/dist/config'
import { generate as generateTypes } from '@redwoodjs/internal/dist/generate/generate'
import { errorTelemetry } from '@redwoodjs/telemetry'

import {
  generateTemplate,
  transformTSToJS,
  getPaths,
  writeFilesTask,
} from '../../../lib'
import c from '../../../lib/colors'
import { pluralize } from '../../../lib/rwPluralize'
import { getSchema, getEnum, verifyModelName } from '../../../lib/schemaHelpers'
import { yargsDefaults } from '../../generate'
import { customOrDefaultTemplatePath, relationsForModel } from '../helpers'
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

const addFieldGraphQLComment = (field, str) => {
  const description = field.documentation || `Description for ${field.name}.`

  return `
  "${description}"
  ${str}`
}

const modelFieldToSDL = ({
  field,
  required = true,
  types = {},
  docs = false,
}) => {
  if (Object.entries(types).length) {
    field.type =
      field.kind === 'object' ? idType(types[field.type]) : field.type
  }

  const dictionary = {
    Json: 'JSON',
    Decimal: 'Float',
  }

  const fieldContent = `${field.name}: ${field.isList ? '[' : ''}${
    dictionary[field.type] || field.type
  }${field.isList ? ']' : ''}${
    (field.isRequired && required) | field.isList ? '!' : ''
  }`
  if (docs) {
    return addFieldGraphQLComment(field, fieldContent)
  } else {
    return fieldContent
  }
}

const querySDL = (model, docs = false) => {
  return model.fields.map((field) => modelFieldToSDL({ field, docs }))
}

const inputSDL = (model, required, types = {}, docs = false) => {
  return model.fields
    .filter((field) => {
      return (
        IGNORE_FIELDS_FOR_INPUT.indexOf(field.name) === -1 &&
        field.kind !== 'object'
      )
    })
    .map((field) => modelFieldToSDL({ field, required, types, docs }))
}

// creates the CreateInput type (all fields are required)
const createInputSDL = (model, types = {}, docs = false) => {
  return inputSDL(model, true, types, docs)
}

// creates the UpdateInput type (not all fields are required)
const updateInputSDL = (model, types = {}, docs = false) => {
  return inputSDL(model, false, types, docs)
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

const sdlFromSchemaModel = async (name, crud, docs = false) => {
  const model = await getSchema(name)

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

  const modelName = model.name
  const modelDescription =
    model.documentation || `Representation of ${modelName}.`

  return {
    modelName,
    modelDescription,
    query: querySDL(model, docs).join('\n    '),
    createInput: createInputSDL(model, types, docs).join('\n    '),
    updateInput: updateInputSDL(model, types, docs).join('\n    '),
    idType: idType(model, crud),
    relations: relationsForModel(model),
    enums,
  }
}

export const files = async ({
  name,
  crud = true,
  docs = false,
  tests,
  typescript,
}) => {
  const {
    modelName,
    modelDescription,
    query,
    createInput,
    updateInput,
    idType,
    relations,
    enums,
  } = await sdlFromSchemaModel(name, crud, docs)

  const templatePath = customOrDefaultTemplatePath({
    side: 'api',
    generator: 'sdl',
    templatePath: 'sdl.ts.template',
  })

  let template = generateTemplate(templatePath, {
    docs,
    modelName,
    modelDescription,
    name,
    crud,
    query,
    createInput,
    updateInput,
    idType,
    enums,
  })

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
    ...(await serviceFiles({
      name,
      crud,
      tests,
      relations,
      typescript,
    })),
  }
}

export const defaults = {
  ...yargsDefaults,
  crud: {
    default: true,
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
      // don't give it a default value, it gets overwritten in first few lines
      // of the handler
    })
    .option('docs', {
      description: 'Generate SDL and GraphQL comments to use in documentation',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#generate-sdl'
      )}`
    )

  // Merge default options in
  Object.entries(defaults).forEach(([option, config]) => {
    yargs.option(option, config)
  })
}
// TODO: Add --dry-run command
export const handler = async ({
  model,
  crud,
  force,
  tests,
  typescript,
  docs,
}) => {
  if (tests === undefined) {
    tests = getConfig().generate.tests
  }

  try {
    const { name } = await verifyModelName({ name: model })

    const tasks = new Listr(
      [
        {
          title: 'Generating SDL files...',
          task: async () => {
            const f = await files({ name, tests, crud, typescript, docs })
            return writeFilesTask(f, { overwriteExisting: force })
          },
        },
        {
          title: `Generating types ...`,
          task: generateTypes,
        },
      ].filter(Boolean),
      { rendererOptions: { collapse: false }, exitOnError: true }
    )

    await tasks.run()
  } catch (e) {
    errorTelemetry(process.argv, e.message)
    console.error(c.error(e.message))
    process.exit(e?.exitCode || 1)
  }
}
