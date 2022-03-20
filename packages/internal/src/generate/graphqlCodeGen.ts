import fs from 'fs'
import path from 'path'

import { loadCodegenConfig } from '@graphql-codegen/cli'
import { codegen } from '@graphql-codegen/core'
import type {
  Types as CodegenTypes,
  CodegenPlugin,
} from '@graphql-codegen/plugin-helpers'
import * as typescriptPlugin from '@graphql-codegen/typescript'
import * as typescriptOperations from '@graphql-codegen/typescript-operations'
import * as typescriptResolvers from '@graphql-codegen/typescript-resolvers'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadDocuments, loadSchemaSync } from '@graphql-tools/load'
import type { LoadTypedefsOptions } from '@graphql-tools/load'
import { DocumentNode } from 'graphql'

import { getPaths } from '../paths'

export const generateTypeDefGraphQLApi = async () => {
  const filename = path.join(getPaths().api.types, 'graphql.d.ts')
  const extraPlugins: CombinedPluginConfig[] = [
    {
      name: 'typescript-resolvers',
      options: {},
      codegenPlugin: typescriptResolvers,
    },
  ]

  try {
    return await runCodegenGraphQL([], extraPlugins, filename)
  } catch {
    console.error()
    console.error('Error: Could not generate GraphQL type definitions (api)')
    console.error()

    return []
  }
}

interface Args {
  /** used for tests */
  logErrors?: boolean | undefined
}

export const generateTypeDefGraphQLWeb = async ({ logErrors }: Args = {}) => {
  const filename = path.join(getPaths().web.types, 'graphql.d.ts')
  const options = getLoadDocumentsOptions(filename)
  const documentsGlob = './web/src/**/!(*.d).{ts,tsx,js,jsx}'

  let documents

  try {
    documents = await loadDocuments([documentsGlob], options)
  } catch {
    // No GraphQL documents present, no need to try to run codegen
    return []
  }

  const extraPlugins: CombinedPluginConfig[] = [
    {
      name: 'typescript-operations',
      options: {},
      codegenPlugin: typescriptOperations,
    },
  ]

  try {
    return await runCodegenGraphQL(documents, extraPlugins, filename)
  } catch (e) {
    console.error()
    console.error('Error: Could not generate GraphQL type definitions (web)')
    console.error()

    if (logErrors) {
      console.error(e)
    }

    return []
  }
}

/**
 * This is the function used internally by generateTypeDefGraphQLApi and generateTypeDefGraphQLWeb
 * And contains the base configuration for generating gql types with codegen
 *
 * Named a little differently to make it easier to spot
 */
async function runCodegenGraphQL(
  documents: CodegenTypes.DocumentFile[],
  extraPlugins: CombinedPluginConfig[],
  filename: string
) {
  const userCodegenConfig = await loadCodegenConfig({
    configFilePath: getPaths().base,
  })

  // Merge in user codegen config with the rw built-in one
  const mergedConfig = {
    ...getPluginConfig(),
    ...userCodegenConfig?.config?.config,
  }

  const options = getCodegenOptions(documents, mergedConfig, extraPlugins)
  const output = await codegen(options)

  const dirname = path.dirname(filename)

  try {
    fs.mkdirSync(dirname, { recursive: true })
    fs.writeFileSync(filename, output)
  } catch (e) {
    console.log('file ops failed')
    console.log(e)
  }

  return [filename]
}

function getLoadDocumentsOptions(filename: string) {
  const loadTypedefsConfig: LoadTypedefsOptions<{ cwd: string }> = {
    cwd: getPaths().base,
    ignore: [path.join(process.cwd(), filename)],
    loaders: [new CodeFileLoader()],
    sort: true,
  }

  return loadTypedefsConfig
}

function getPluginConfig() {
  const pluginConfig: CodegenTypes.PluginConfig = {
    namingConvention: 'keep', // to allow camelCased query names
    scalars: {
      // We need these, otherwise these scalars are mapped to any
      // @TODO is there a way we can use scalars defined in
      // packages/graphql-server/src/rootSchema.ts
      BigInt: 'number',
      DateTime: 'string',
      Date: 'string',
      JSON: 'Record<string, unknown>',
      JSONObject: 'Record<string, unknown>',
      Time: 'string',
    },
    // prevent type names being PetQueryQuery, RW generators already append
    // Query/Mutation/etc
    omitOperationSuffix: true,
  }

  return pluginConfig
}

interface CombinedPluginConfig {
  name: string
  options: CodegenTypes.PluginConfig
  codegenPlugin: CodegenPlugin
}

function getCodegenOptions(
  documents: CodegenTypes.DocumentFile[],
  config: CodegenTypes.PluginConfig,
  extraPlugins: CombinedPluginConfig[]
) {
  const plugins = [
    { typescript: { enumsAsTypes: true } },
    ...extraPlugins.map((plugin) => ({ [plugin.name]: plugin.options })),
  ]

  const pluginMap = {
    typescript: typescriptPlugin,
    ...extraPlugins.reduce(
      (acc, cur) => ({ ...acc, [cur.name]: cur.codegenPlugin }),
      {}
    ),
  }

  const options: CodegenTypes.GenerateOptions = {
    // The typescript plugin returns a string instead of writing to a file, so
    // `filename` is not used
    filename: '',
    // `schemaAst` is used instead of `schema` if `schemaAst` is defined, and
    // `schema` isn't. In the source for GenerateOptions they have this
    // comment:
    //   Remove schemaAst and change schema to GraphQLSchema in the next major
    //   version
    // When that happens we'll have have to remove our `schema` line, and
    // rename `schemaAst` to `schema`
    schema: undefined as unknown as DocumentNode,
    schemaAst: loadSchemaSync(getPaths().generated.schema, {
      loaders: [new GraphQLFileLoader()],
      sort: true,
    }),
    documents,
    config,
    plugins,
    pluginMap,
    pluginContext: {},
  }

  return options
}
