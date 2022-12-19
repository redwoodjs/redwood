import fs from 'fs'

import { codegen } from '@graphql-codegen/core'
import type { Types as CodegenTypes } from '@graphql-codegen/plugin-helpers'
import * as schemaAstPlugin from '@graphql-codegen/schema-ast'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { loadSchema, LoadSchemaOptions } from '@graphql-tools/load'
import chalk from 'chalk'
import { DocumentNode, print } from 'graphql'
import terminalLink from 'terminal-link'

import { rootSchema } from '@redwoodjs/graphql-server'

import { getPaths } from '../paths'

export const generateGraphQLSchema = async () => {
  const schemaPointerMap = {
    [print(rootSchema.schema)]: {},
    'graphql/**/*.sdl.{js,ts}': {},
    'directives/**/*.{js,ts}': {},
  }

  const loadSchemaConfig: LoadSchemaOptions = {
    assumeValidSDL: true,
    sort: true,
    convertExtensions: true,
    includeSources: true,
    cwd: getPaths().api.src,
    schema: Object.keys(schemaPointerMap),
    generates: {
      [getPaths().generated.schema]: {
        plugins: ['schema-ast'],
      },
    },
    silent: false,
    errorsOnly: false,
    pluginContext: {},
    loaders: [new CodeFileLoader()],
  }

  let loadedSchema

  try {
    loadedSchema = await loadSchema(schemaPointerMap, loadSchemaConfig)
  } catch (e) {
    if (e instanceof Error) {
      const match = e.message.match(/Unknown type: "(\w+)"/)
      const name = match?.[1]
      const schemaPrisma = fs.readFileSync(getPaths().api.dbSchema)

      console.error('')
      console.error('Schema loading failed.', e.message)
      console.error('')

      if (name && schemaPrisma.includes(`model ${name}`)) {
        // Not all SDLs need to be backed by a DB model, but if they are we can
        // provide a more helpful error message

        console.error(
          [
            `  ${chalk.bgYellow(` ${chalk.black.bold('Heads up')} `)}`,
            '',
            chalk.yellow(
              `  It looks like you have a ${name} model in your Prisma schema.`
            ),
            chalk.yellow(
              `  If it's part of a relation, you may have to generate SDL or scaffolding for ${name} too.`
            ),
            chalk.yellow(
              `  So, if you haven't done that yet, ignore this error message and run the SDL or scaffold generator for ${name} now.`
            ),
            '',
            chalk.yellow(
              `  See the ${terminalLink(
                'Troubleshooting Generators',
                'https://redwoodjs.com/docs/schema-relations#troubleshooting-generators'
              )} section in our docs for more help.`
            ),
            '',
          ].join('\n')
        )
      }
    }

    console.error(e)
    // Had to do this, or the full stacktrace wouldn't come through, and I
    // couldn't add a blank line after the stacktrace :( :shrug:
    console.error('\n\n\n\n\n\n')
  }

  const options: CodegenTypes.GenerateOptions = {
    config: {}, // no extra config needed for merged schema file generation
    plugins: [{ 'schema-ast': {} }],
    pluginMap: { 'schema-ast': schemaAstPlugin },
    schema: {} as unknown as DocumentNode,
    schemaAst: loadedSchema,
    filename: getPaths().generated.schema,
    documents: [],
  }

  if (loadedSchema) {
    try {
      const schema = await codegen(options)
      fs.writeFileSync(getPaths().generated.schema, schema)
      return getPaths().generated.schema
    } catch (e) {
      console.error('GraphQL Schema codegen failed.')
      console.error(e)
    }
  }

  return ''
}
