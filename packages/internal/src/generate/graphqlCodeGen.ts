import fs from 'fs'
import path from 'path'

import * as addPlugin from '@graphql-codegen/add'
import { loadCodegenConfig } from '@graphql-codegen/cli'
import { codegen } from '@graphql-codegen/core'
import type {
  Types as CodegenTypes,
  CodegenPlugin,
} from '@graphql-codegen/plugin-helpers'
import * as typescriptPlugin from '@graphql-codegen/typescript'
import * as typescriptOperations from '@graphql-codegen/typescript-operations'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadDocuments, loadSchemaSync } from '@graphql-tools/load'
import type { LoadTypedefsOptions } from '@graphql-tools/load'
import execa from 'execa'
import { DocumentNode } from 'graphql'

import { getPaths } from '../paths'
import { getTsConfigs } from '../project'

import * as rwTypescriptResolvers from './plugins/rw-typescript-resolvers'

enum CodegenSide {
  API,
  WEB,
}

export const generateTypeDefGraphQLApi = async () => {
  const filename = path.join(getPaths().api.types, 'graphql.d.ts')
  const prismaModels = getPrismaModels()
  const prismaImports = Object.keys(prismaModels).map((key) => {
    return `${key} as Prisma${key}`
  })

  const extraPlugins: CombinedPluginConfig[] = [
    {
      name: 'add',
      options: {
        content: [
          'import { Prisma } from "@prisma/client"',
          "import { MergePrismaWithSdlTypes, MakeRelationsOptional } from '@redwoodjs/api'",
          `import { ${prismaImports.join(', ')} } from '@prisma/client'`,
        ],
        placement: 'prepend',
      },
      codegenPlugin: addPlugin,
    },
    {
      name: 'print-mapped-moddels',
      options: {},
      codegenPlugin: printMappedModelsPlugin,
    },
    {
      name: 'typescript-resolvers',
      options: {},
      codegenPlugin: rwTypescriptResolvers,
    },
  ]

  try {
    return await runCodegenGraphQL([], extraPlugins, filename, CodegenSide.API)
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
      name: 'add',
      options: {
        content: 'import { Prisma } from "@prisma/client"',
        placement: 'prepend',
      },
      codegenPlugin: addPlugin,
    },
    {
      name: 'typescript-operations',
      options: {},
      codegenPlugin: typescriptOperations,
    },
  ]

  try {
    return await runCodegenGraphQL(
      documents,
      extraPlugins,
      filename,
      CodegenSide.WEB
    )
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
  filename: string,
  side: CodegenSide
) {
  const userCodegenConfig = await loadCodegenConfig({
    configFilePath: getPaths().base,
  })

  // Merge in user codegen config with the rw built-in one
  const mergedConfig = {
    ...getPluginConfig(side),
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

function getPrismaClient(hasGenerated = false): {
  ModelName: Record<string, string>
} {
  const localPrisma = require('@prisma/client')

  if (!localPrisma.ModelName) {
    if (hasGenerated) {
      return { ModelName: {} }
    } else {
      execa.sync('yarn rw prisma generate', { shell: true })

      // Purge Prisma Client from node's require cache, so that the newly
      // generated client gets picked up by any script that uses it
      Object.keys(require.cache).forEach((key) => {
        if (
          key.includes('/node_modules/@prisma/client/') ||
          key.includes('/node_modules/.prisma/client/')
        ) {
          delete require.cache[key]
        }
      })

      return getPrismaClient(true)
    }
  }

  return localPrisma
}

function getPrismaModels() {
  // Extract the models from the prisma client and use those to
  // set up internal redirects for the return values in resolvers.
  const localPrisma = getPrismaClient()
  const prismaModels = localPrisma.ModelName

  // This isn't really something you'd put in the GraphQL API, so
  // we can skip the model.
  if (prismaModels.RW_DataMigration) {
    delete prismaModels.RW_DataMigration
  }

  return prismaModels
}

function getPluginConfig(side: CodegenSide) {
  const prismaModels: Record<string, string> = getPrismaModels()
  Object.keys(prismaModels).forEach((key) => {
    /** creates an object like this
     * {
     *  Post: MergePrismaWithSdlTypes<PrismaPost, MakeRelationsOptional<Post, AllMappedModels>, AllMappedModels>>
     *  ...
     * }
     */
    prismaModels[
      key
    ] = `MergePrismaWithSdlTypes<Prisma${key}, MakeRelationsOptional<${key}, AllMappedModels>, AllMappedModels>`
  })

  const pluginConfig: CodegenTypes.PluginConfig &
    rwTypescriptResolvers.TypeScriptResolversPluginConfig = {
    makeResolverTypeCallable: true,
    namingConvention: 'keep', // to allow camelCased query names
    scalars: {
      // We need these, otherwise these scalars are mapped to any
      BigInt: 'number',
      // @Note: DateTime fields can be valid Date-strings, or the Date object in the api side. They're always strings on the web side.
      DateTime: side === CodegenSide.WEB ? 'string' : 'Date | string',
      Date: side === CodegenSide.WEB ? 'string' : 'Date | string',
      JSON: 'Prisma.JsonValue',
      JSONObject: 'Prisma.JsonObject',
      Time: side === CodegenSide.WEB ? 'string' : 'Date | string',
    },
    // prevent type names being PetQueryQuery, RW generators already append
    // Query/Mutation/etc
    omitOperationSuffix: true,
    showUnusedMappers: false,
    customResolverFn: getResolverFnType(),
    mappers: prismaModels,
    avoidOptionals: {
      // We do this, so that service tests can call resolvers without doing a null check
      // see https://github.com/redwoodjs/redwood/pull/6222#issuecomment-1230156868
      // Look at type or source https://shrtm.nu/2BA0 for possible config, not well documented
      resolvers: true,
    },
    contextType: `@redwoodjs/graphql-server/dist/functions/types#RedwoodGraphQLContext`,
  }

  return pluginConfig
}

export const getResolverFnType = () => {
  const tsConfig = getTsConfigs()

  if (tsConfig.api?.compilerOptions?.strict) {
    // In strict mode, bring a world of pain to the tests
    return `(
      args: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>`
  } else {
    return `(
      args?: TArgs,
      obj?: { root: TParent; context: TContext; info: GraphQLResolveInfo }
    ) => TResult | Promise<TResult>`
  }
}

interface CombinedPluginConfig {
  name: string
  options: CodegenTypes.PluginConfig
  codegenPlugin: CodegenPlugin
}

/**
 * Codgen plugin that just lists all the SDL models that are also mapped Prisma models
 * We use a plugin, because its possible to have Prisma models that do not have an SDL model
 * so we can't just list all the Prisma models, even if they're included in the mappers object.
 *
 * Example:
 * type AllMappedModels = MaybeOrArrayOfMaybe<Post | User>
 *
 * Note that the types are SDL types, not Prisma types.
 * We do not include SDL-only types in this list.
 */
const printMappedModelsPlugin: CodegenPlugin = {
  plugin: (schema, _documents, config) => {
    // this way we can make sure relation types are not required
    const sdlTypesWhichAreMapped = Object.values(schema.getTypeMap())
      .filter((type) => {
        return type.astNode?.kind === 'ObjectTypeDefinition'
      })
      .filter((objectDefType) => {
        const modelName = objectDefType.astNode?.name.value
        return (
          modelName && modelName in config.mappers // Only keep the mapped Prisma models
        )
      })
      .map((objectDefType) => objectDefType.astNode?.name.value)

    return `type MaybeOrArrayOfMaybe<T> = T | Maybe<T> | Maybe<T>[];\ntype AllMappedModels = MaybeOrArrayOfMaybe<${sdlTypesWhichAreMapped.join(
      ' | '
    )}>`
  },
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
