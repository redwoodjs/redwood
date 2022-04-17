import fs from 'fs'

import { codegen } from '@graphql-codegen/core'
import type { Types as CodegenTypes } from '@graphql-codegen/plugin-helpers'
import * as schemaAstPlugin from '@graphql-codegen/schema-ast'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { loadSchema, LoadSchemaOptions } from '@graphql-tools/load'
import { DocumentNode, print } from 'graphql'

import { rootSchema } from '@redwoodjs/graphql-server'

import { getPaths } from '../paths'

export const generateGraphQLSchema = async () => {
  const schemaPointerMap = {
    [print(rootSchema.schema)]: {},
    'graphql/**/*.sdl.{js,ts}': {},
    'directives/**/*.{js,ts}': {},
  }

  const config = {
    scalars: {
      BigInt: 'number',
      DateTime: 'string',
      Date: 'string',
      JSON: 'Record<string, unknown>',
      JSONObject: 'Record<string, unknown>',
      Time: 'string',
    },
  }

  const loadSchemaConfig: LoadSchemaOptions = {
    assumeValidSDL: true,
    sort: true,
    convertExtensions: true,
    includeSources: true,
    cwd: getPaths().api.src,
    schema: Object.keys(schemaPointerMap),
    config,
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

      console.error('Schema loading failed.', e.message)

      if (name && schemaPrisma.includes(`model ${name}`)) {
        // Not all SDLs need to be backed by a DB model, but if they are we can
        // provide a more helpful error message

        console.error('')
        console.error(
          `It looks like you have a ${name} model in your database schema.`
        )
        console.error(
          'Try running the generator you just used for that model first instead'
        )
      }
    }

    console.error('Schema loading failed', e)
  }

  const options: CodegenTypes.GenerateOptions = {
    config,
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
