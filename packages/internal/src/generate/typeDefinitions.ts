import fs from 'fs'
import path from 'path'

import { types } from '@babel/core'
import traverse from '@babel/traverse'
import { SourceMapGenerator } from 'source-map'

import { getPaths, processPagesDir } from '@redwoodjs/project-config'

import { getCellGqlQuery, fileToAst } from '../ast'
import { findCells, findDirectoryNamedModules } from '../files'
import { parseGqlQueryToAst } from '../gql'
import { getJsxElements } from '../jsx'

import {
  generateTypeDefGraphQLApi,
  generateTypeDefGraphQLWeb,
} from './graphqlCodeGen'
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
  const { typeDefFiles: gqlApiTypeDefFiles, errors: apiErrors } =
    await generateTypeDefGraphQLApi()
  const { typeDefFiles: gqlWebTypeDefFiles, errors: webErrors } =
    await generateTypeDefGraphQLWeb()

  return {
    typeDefFiles: [
      ...generateMirrorDirectoryNamedModules(),
      ...generateMirrorCells(),
      ...generateTypeDefRouterPages(),
      ...generateTypeDefCurrentUser(),
      ...generateTypeDefRouterRoutes(),
      ...generateTypeDefGlobImports(),
      ...generateTypeDefGlobalContext(),
      ...generateTypeDefScenarios(),
      ...generateTypeDefTestMocks(),
      ...generateStubStorybookTypes(),
      ...gqlApiTypeDefFiles,
      ...gqlWebTypeDefFiles,
    ],
    errors: [...apiErrors, ...webErrors],
  }
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

  // We add a source map to allow "go to definition" to avoid ending in the .d.ts file
  // We do this for the web side only
  if (p.startsWith(rwjsPaths.web.src)) {
    // Get the line and column where the default export is defined
    let originalLine = 1
    let originalColumn = 0

    const fileContents = fileToAst(p)

    // Get the default export
    let defaultExport: types.ExportDefaultDeclaration | undefined
    traverse(fileContents, {
      ExportDefaultDeclaration(path) {
        defaultExport = path.node
      },
    })

    // We should have found a default export, but if not let's just return without
    // generating a source map
    if (!defaultExport) {
      return typeDefPath
    }

    // Handle the case were we're exporting a variable declared elsewhere
    // as we will want to find the location of that declaration instead
    if (types.isIdentifier(defaultExport.declaration)) {
      // Directly search the program body for the declaration of the identifier
      // to avoid picking up other identifiers with the same name in the file
      const exportedName = defaultExport.declaration.name
      const declaration = (fileContents as types.File).program.body.find(
        (node) => {
          return (
            types.isVariableDeclaration(node) &&
            node.declarations.find((d) => {
              return (
                types.isVariableDeclarator(d) &&
                types.isIdentifier(d.id) &&
                d.id.name === exportedName
              )
            })
          )
        }
      )
      originalLine = declaration?.loc?.start.line ?? 1
      originalColumn = declaration?.loc?.start.column ?? 0
    } else {
      originalLine = defaultExport.loc?.start.line ?? 1
      originalColumn = defaultExport.loc?.start.column ?? 0
    }

    // Generate a source map that points to the definition of the default export
    const map = new SourceMapGenerator({
      file: 'index.d.ts',
    })
    map.addMapping({
      generated: {
        line: 4,
        column: 0,
      },
      source: path.relative(path.dirname(typeDefPath), p),
      original: {
        line: originalLine,
        column: originalColumn,
      },
    })

    // Write the source map directly beside the .d.ts file
    fs.writeFileSync(
      `${typeDefPath}.map`,
      JSON.stringify(map.toJSON(), undefined, 2)
    )
  }

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

  // We add a source map to allow "go to definition" to avoid ending in the .d.ts file
  // Unlike pages, layouts, components etc. there is no clear definition location so we link
  // to the head of the file

  // Generate a source map that points to the definition
  const map = new SourceMapGenerator({
    file: 'index.d.ts',
  })
  map.addMapping({
    generated: {
      line: 10,
      column: 0,
    },
    source: path.relative(path.dirname(typeDefPath), p),
    original: {
      line: 1,
      column: 0,
    },
  })

  // Write the source map directly beside the .d.ts file
  fs.writeFileSync(
    `${typeDefPath}.map`,
    JSON.stringify(map.toJSON(), undefined, 2)
  )

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

function generateStubStorybookTypes() {
  const stubStorybookTypesFileContent = `\
declare module '@storybook/react' {
  export type Meta<T = any> = any
  export type StoryObj<T = any> = any
}
`

  const redwoodProjectPaths = getPaths()

  const packageJson = JSON.parse(
    fs.readFileSync(
      path.join(redwoodProjectPaths.base, 'package.json'),
      'utf-8'
    )
  )

  const hasCliStorybook = Object.keys(packageJson['devDependencies']).includes(
    '@redwoodjs/cli-storybook'
  )

  if (hasCliStorybook) {
    return []
  }

  const stubStorybookTypesFilePath = path.join(
    redwoodProjectPaths.generated.types.includes,
    'web-storybook.d.ts'
  )
  fs.writeFileSync(stubStorybookTypesFilePath, stubStorybookTypesFileContent)

  return [stubStorybookTypesFilePath]
}
