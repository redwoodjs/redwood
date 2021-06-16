import fs from 'fs'
import path from 'path'

import { generate } from '@graphql-codegen/cli'

import { getCellGqlQuery } from 'src/ast'
import { findCells, findDirectoryNamedModules } from 'src/files'
import { parseGqlQueryToAst } from 'src/gql'
import { getJsxElements } from 'src/jsx'
import { getPaths, processPagesDir } from 'src/paths'

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

  const fileContents = fs.readFileSync(p, 'utf-8')
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
  const code = fs.readFileSync(getPaths().web.routes, 'utf-8')
  const routes = getJsxElements(code, 'Route').filter((x) => {
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

export const generateTypeDefGlobImports = () => {
  return writeTypeDefIncludeFile('api-globImports.d.ts.template')
}

export const generateTypeDefGlobalContext = () => {
  return writeTypeDefIncludeFile('api-globalContext.d.ts.template')
}

// TODO: We're going to have to give the user an entry point into this
// configuration file because they may have to define other scalars
// and they may want to generate a custom side. :shrug
// TODO: Figure out how to get a list of scalars from the api-side so that
// they don't get out of sync.
export const generateTypeDefGraphQLApi = async () => {
  try {
    const rwjsPaths = getPaths()
    const f = await generateTypeDefGraphQL({
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

export const generateTypeDefGraphQLWeb = async () => {
  if (findCells().length) {
    const rwjsPaths = getPaths()
    try {
      const f = await generateTypeDefGraphQL({
        [path.join(rwjsPaths.web.types, 'graphql.d.ts')]: {
          documents: './web/src/**/!(*.d).{ts,tsx,js,jsx}',
          plugins: [
            {
              typescript: {
                enumsAsTypes: true,
              },
            },
            'typescript-operations',
          ],
        },
      })
      return f
    } catch (e) {
      console.error()
      console.error('Error: Could not generate GraphQL type definitions (web)')
      console.error()
      return []
    }
  } else {
    return []
  }
}

const generateTypeDefGraphQL = async (generates: Record<string, unknown>) => {
  const rwjsPaths = getPaths()
  type GenerateResponse = { filename: string; contents: string }[]
  // https://www.graphql-code-generator.com/docs/getting-started/programmatic-usage#using-the-cli-instead-of-core
  const f: GenerateResponse = await generate(
    {
      cwd: rwjsPaths.base,
      schema: rwjsPaths.generated.schema,
      config: {
        scalars: {
          DateTime: 'string',
          Date: 'string',
          JSON: 'Record<string, unknown>',
          JSONObject: 'Record<string, unknown>',
          Time: 'string',
        },
        omitOperationSuffix: true, // prevent type names being PetQueryQuery, RW generators already append Query/Mutation/etc.
      },
      // @ts-expect-error TODO: Figure out how to get the proper type here.
      generates,
      silent: false,
      errorsOnly: true,
    },
    true
  )
  return f.map(({ filename }) => filename)
}
