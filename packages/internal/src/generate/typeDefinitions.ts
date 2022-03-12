import fs from 'fs'
import path from 'path'

import { generate, loadCodegenConfig } from '@graphql-codegen/cli'
import type { Types as CodegenTypes } from '@graphql-codegen/plugin-helpers'
import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { loadDocuments } from '@graphql-tools/load'
import type { LoadTypedefsOptions } from '@graphql-tools/load'

import { getCellGqlQuery, fileToAst } from '../ast'
import { findCells, findDirectoryNamedModules } from '../files'
import { parseGqlQueryToAst } from '../gql'
import { getJsxElements } from '../jsx'
import { getPaths, processPagesDir } from '../paths'

import { writeTemplate } from './templates'

// TODO:
// Common return format for CLI output:
// ['type', 'relative path to base']

// Note for contributors:
//
// The functions in this file generate type definitions of which there are two types:
//
// 1. Mirror types: Create a virtual directory that allows us to type
// cells and directory named modules.
// 2. Types based on contents of other files
//
// When generating a new type definition that targets a particular side,
// you must prefix the generated filename
// with "web-" or "api-" to target inclusion for that side,
// or use "all-" for both. This is controlled by the user's "tsconfig.json"
// file.

/**
 * Generate all the types for a RedwoodJS project
 * and return the generated path to files, so they're logged
 */
export const generateTypeDefs = async () => {
  // Return all the paths so they can be printed
  const gqlApi = await generateTypeDefGraphQLApi()
  const gqlWeb = await generateTypeDefGraphQLWeb()
  return [
    ...generateMirrorDirectoryNamedModules(),
    ...generateMirrorCells(),
    ...generateTypeDefRouterPages(),
    ...generateTypeDefCurrentUser(),
    ...generateTypeDefRouterRoutes(),
    ...generateTypeDefGlobImports(),
    ...generateTypeDefGlobalContext(),
    ...generateTypeDefScenarios(),
    ...generateTypeDefTestMocks(),
    ...gqlApi,
    ...gqlWeb,
  ]
}

export const generateMirrorDirectoryNamedModules = () => {
  const rwjsPaths = getPaths()
  return findDirectoryNamedModules().map((p) =>
    generateMirrorDirectoryNamedModule(p, rwjsPaths)
  )
}

export const mirrorPathForDirectoryNamedModules = (
  p: string,
  rwjsPaths = getPaths()
) => {
  return [
    path.join(
      rwjsPaths.generated.types.mirror,
      path.relative(rwjsPaths.base, path.dirname(p))
    ),
    'index.d.ts',
  ]
}

export const generateMirrorDirectoryNamedModule = (
  p: string,
  rwjsPaths = getPaths()
) => {
  const [mirrorDir, typeDef] = mirrorPathForDirectoryNamedModules(p, rwjsPaths)
  fs.mkdirSync(mirrorDir, { recursive: true })

  const typeDefPath = path.join(mirrorDir, typeDef)
  const { name } = path.parse(p)

  writeTemplate(
    'templates/mirror-directoryNamedModule.d.ts.template',
    typeDefPath,
    { name }
  )
  return typeDefPath
}

export const generateMirrorCells = () => {
  const rwjsPaths = getPaths()
  return findCells().map((p) => generateMirrorCell(p, rwjsPaths))
}

export const mirrorPathForCell = (p: string, rwjsPaths = getPaths()) => {
  const mirrorDir = path.join(
    rwjsPaths.generated.types.mirror,
    path.relative(rwjsPaths.base, path.dirname(p))
  )

  fs.mkdirSync(mirrorDir, { recursive: true })
  return [mirrorDir, 'index.d.ts']
}

export const generateMirrorCell = (p: string, rwjsPaths = getPaths()) => {
  const [mirrorDir, typeDef] = mirrorPathForCell(p, rwjsPaths)
  fs.mkdirSync(mirrorDir, { recursive: true })

  const typeDefPath = path.join(mirrorDir, typeDef)
  const { name } = path.parse(p)

  const fileContents = fileToAst(p)
  const cellQuery = getCellGqlQuery(fileContents)

  if (cellQuery) {
    const gqlDoc = parseGqlQueryToAst(cellQuery)[0]

    writeTemplate('templates/mirror-cell.d.ts.template', typeDefPath, {
      name,
      queryResultType: `${gqlDoc?.name}`,
      queryVariablesType: `${gqlDoc?.name}Variables`,
    })
  } else {
    // If for some reason we can't parse the query, generated the mirror cell anyway
    writeTemplate('templates/mirror-cell.d.ts.template', typeDefPath, {
      name,
      queryResultType: 'any',
      queryVariablesType: 'any',
    })
  }

  return typeDefPath
}

const writeTypeDefIncludeFile = (
  template: string,
  values: Record<string, unknown> = {}
) => {
  const rwjsPaths = getPaths()
  const typeDefPath = path.join(
    rwjsPaths.generated.types.includes,
    template.replace('.template', '')
  )

  const templateFilename = path.join('templates', template)
  writeTemplate(templateFilename, typeDefPath, values)
  return [typeDefPath]
}

export const generateTypeDefRouterRoutes = () => {
  const ast = fileToAst(getPaths().web.routes)
  const routes = getJsxElements(ast, 'Route').filter((x) => {
    // All generated "routes" should have a "name" and "path" prop-value
    return (
      typeof x.props?.path !== 'undefined' &&
      typeof x.props?.name !== 'undefined'
    )
  })

  return writeTypeDefIncludeFile('web-routerRoutes.d.ts.template', { routes })
}

export const generateTypeDefRouterPages = () => {
  const pages = processPagesDir()
  return writeTypeDefIncludeFile('web-routesPages.d.ts.template', { pages })
}

export const generateTypeDefCurrentUser = () => {
  return writeTypeDefIncludeFile('all-currentUser.d.ts.template')
}

export const generateTypeDefScenarios = () => {
  return writeTypeDefIncludeFile('api-scenarios.d.ts.template')
}

export const generateTypeDefTestMocks = () => {
  return [
    writeTypeDefIncludeFile('api-test-globals.d.ts.template'),
    writeTypeDefIncludeFile('web-test-globals.d.ts.template'),
  ].flat()
}

export const generateTypeDefGlobImports = () => {
  return writeTypeDefIncludeFile('api-globImports.d.ts.template')
}

export const generateTypeDefGlobalContext = () => {
  return writeTypeDefIncludeFile('api-globalContext.d.ts.template')
}

export const generateTypeDefGraphQLApi = async () => {
  try {
    const rwjsPaths = getPaths()
    const f = await runCodegenGraphQL({
      [path.join(rwjsPaths.api.types, 'graphql.d.ts')]: {
        plugins: [
          {
            typescript: { enumsAsTypes: true },
          },
          'typescript-resolvers',
        ],
      },
    })
    return f
  } catch (e) {
    console.error()
    console.error('Error: Could not generate GraphQL type definitions (api)')
    console.error()
    return []
  }
}

function generateLoadTypedefsConfig(
  generates: Record<
    string,
    CodegenTypes.ConfiguredOutput | CodegenTypes.ConfiguredPlugin[]
  >
) {
  const rwjsPaths = getPaths()

  const ignore = []
  for (const generatePath of Object.keys(generates)) {
    if (path.extname(generatePath) === '') {
      // we omit paths that don't resolve to a specific file
      continue
    }
    ignore.push(path.join(process.cwd(), generatePath))
  }

  const loaders = [
    new CodeFileLoader({
      pluckConfig: {
        skipIndent: true,
      },
    }),
  ]

  const loadTypedefsConfig: LoadTypedefsOptions<{ cwd: string }> = {
    ignore,
    loaders,
    cwd: rwjsPaths.base,
  }

  return loadTypedefsConfig
}

function generateCodegenConfig(
  generates: Record<
    string,
    CodegenTypes.ConfiguredOutput | CodegenTypes.ConfiguredPlugin[]
  >
) {
  const rwjsPaths = getPaths()

  const codegenConfig: CodegenConfig = {
    cwd: rwjsPaths.base,
    schema: rwjsPaths.generated.schema,
    config: {
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
    },
    generates,
    silent: false,
    errorsOnly: true,
  }

  return codegenConfig
}

export const generateTypeDefGraphQLWeb = async () => {
  const rwjsPaths = getPaths()
  const documentsGlob = './web/src/**/!(*.d).{ts,tsx,js,jsx}'

  const generates = {
    [path.join(rwjsPaths.web.types, 'graphql.d.ts')]: {
      documents: documentsGlob,
      plugins: [
        {
          typescript: {
            enumsAsTypes: true,
          },
        },
        'typescript-operations',
      ],
    },
  }

  const options = generateLoadTypedefsConfig(generates)

  try {
    await loadDocuments([documentsGlob], options)
  } catch {
    // No GraphQL documents present (web), no need to try to run codegen
    return []
  }

  try {
    const f = await runCodegenGraphQL(generates)
    return f
  } catch {
    console.error()
    console.error('Error: Could not generate GraphQL type definitions (web)')
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

// CLI generate also takes cwd
type CodegenConfig = CodegenTypes.Config & { cwd: string }

const runCodegenGraphQL = async (
  generates: Record<string, CodegenTypes.ConfiguredOutput>
) => {
  const rwjsPaths = getPaths()
  type GenerateResponse = { filename: string; contents: string }[]

  const userCodegenConfig = await loadCodegenConfig({
    configFilePath: rwjsPaths.base,
  })

  // https://www.graphql-code-generator.com/docs/getting-started/programmatic-usage#using-the-cli-instead-of-core
  const f: GenerateResponse = await generate(
    // Merge in user codegen config with the rw built-in one
    { ...generateCodegenConfig(generates), ...userCodegenConfig?.config },
    true
  )
  return f.map(({ filename }) => filename)
}
