import fs from 'fs'
import path from 'path'

import { generate } from '@graphql-codegen/cli'

import { findCells, findDirectoryNamedModules } from 'src/files'
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
 * and return the generated files.
 */
export const generateTypeDefs = async () => {
  // MARK What does p mean?!
  const p1 = generateMirrorDirectoryNamedModules()
  const p2 = generateMirrorCells()
  const p3 = generateTypeDefRouterPages()
  const p4 = generateTypeDefCurrentUser()
  const p5 = generateTypeDefRouterRoutes()
  const p6 = generateTypeDefGlobImports()
  const p7 = generateTypeDefGlobalContext()
  const p8 = generateTypeDefScenarios()
  const p9 = await generateTypeDefGraphQL()

  // MARK What is this?
  // Why create another array
  return [...p1, ...p2, p3[0], p4[0], p5[0], p6[0], p7[0], ...p8, ...p9]
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
  writeTemplate('templates/mirror-cell.d.ts.template', typeDefPath, { name })
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
export const generateTypeDefGraphQL = async (
  side: 'web' | 'api' | 'all' = 'all'
) => {
  const rwjsPaths = getPaths()
  type GenerateResponse = { filename: string; contents: string }[]
  try {
    // TODO: Figure out how to get this type.
    const generates: Record<string, unknown> = {}

    if (['api', 'all'].includes(side)) {
      generates[path.join(rwjsPaths.api.base, 'types/graphql.d.ts')] = {
        plugins: ['typescript', 'typescript-resolvers'],
      }
    }
    if (['web', 'all'].includes(side)) {
      generates[path.join(rwjsPaths.web.base, 'types/graphql.d.ts')] = {
        documents: './web/src/**/!(*.d).{ts,tsx,js,jsx}',
        plugins: ['typescript', 'typescript-operations'],
      }
    }

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
        // @ts-expect-error - Meh.
        generates,
        silent: false,
        errorsOnly: true,
      },
      true
    )
    return f.map(({ filename }) => filename)
  } catch (e) {
    // `generate` outputs errors which are helpful.
    // This tries to clean up the output of those errors.
    console.error()
    console.error('Error: Could not generate GraphQL type definitions')
    console.error()

    return []
  }
}
