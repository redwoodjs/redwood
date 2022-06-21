import fs from 'fs'
import path from 'path'

// import * as add from '@graphql-codegen/add'
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
  } catch (e) {
    console.error()
    console.error('Error: Could not generate GraphQL type definitions (api)')
    console.error(e)
    console.error()

    return []
  }
}

export const generateTypeDefGraphQLWeb = async () => {
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
    console.error(e)
    console.error()

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

  fs.mkdirSync(path.dirname(filename), { recursive: true })
  fs.writeFileSync(filename, output)

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
  let prismaModels: Record<string, string> = {}
  try {
    // Extract the models from the prisma client and use those to
    // set up internal redirects for the return values in resolvers.
    const localPrisma = require('@prisma/client')
    prismaModels = localPrisma.ModelName
    Object.keys(prismaModels).forEach((key) => {
      prismaModels[key] = `.prisma/client#${key} as Prisma${key}`
    })
    // This isn't really something you'd put in the GraphQL API, so
    // we can skip the model.
    if (prismaModels.RW_DataMigration) {
      delete prismaModels.RW_DataMigration
    }

    // Include Prisma's JSON field types as these types exist to match the types supported by JSON.parse()
    // see: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields
    // We're doing this to avoid adding an extra import statement just for the Prisma namespace
    prismaModels['JSON'] = `.prisma/client#Prisma`
  } catch (error) {
    // This means they've not set up prisma types yet
  }

  const pluginConfig: CodegenTypes.PluginConfig &
    typescriptResolvers.TypeScriptResolversPluginConfig = {
    makeResolverTypeCallable: true,
    namingConvention: 'keep', // to allow camelCased query names
    scalars: {
      // We need these, otherwise these scalars are mapped to any
      BigInt: 'number',
      DateTime: 'string',
      Date: 'string',
      JSON: 'Prisma.JsonValue',
      JSONObject: 'Prisma.JsonObject',
      Time: 'string',
    },
    // prevent type names being PetQueryQuery, RW generators already append
    // Query/Mutation/etc
    omitOperationSuffix: true,
    showUnusedMappers: false,
    customResolverFn: `(
      args?: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => Promise<Partial<TResult>> | Partial<TResult>;`,
    mappers: prismaModels,
    contextType: `@redwoodjs/graphql-server/dist/functions/types#RedwoodGraphQLContext`,
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
