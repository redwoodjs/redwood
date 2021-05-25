import fs from 'fs'
import path from 'path'

import { findCells, findDirectoryNamedModules } from 'src/files'
import { getJsxElements } from 'src/jsx'
import { getPaths, processPagesDir } from 'src/paths'

import { writeTemplate } from './templates'

// Note for contributors:
//
// The functions in this file generate type definitions.
//
// When generating a new type definition that targets a particular side,
// you must prefix the generated filename
// with "web-" or "api-" to target inclusion for that side,
// or use "all-" for both.

export const generateTypeDefs = () => {
  const p1 = generateMirrorDirectoryNamedModules()
  const p2 = generateMirrorCells()
  const p3 = generateTypeDefRouterPages()
  const p4 = generateTypeDefCurrentUser()
  const p5 = generateTypeDefRouterRoutes()
  const p6 = generateTypeDefGlobImports()
  const p7 = generateTypeDefGlobalContext()

  return [...p1, ...p2, p3[0], p4[0], p5[0], p6[0], p7[0]]
}

export const generateMirrorDirectoryNamedModules = () => {
  const rwjsPaths = getPaths()
  return findDirectoryNamedModules().map((p) =>
    generateMirrorDirectoryNamedModule(p, rwjsPaths)
  )
}

export const generateMirrorDirectoryNamedModule = (
  p: string,
  rwjsPaths = getPaths()
) => {
  const { dir, name } = path.parse(p)

  const mirrorDir = path.join(
    rwjsPaths.generated.types.mirror,
    dir.replace(rwjsPaths.base, '')
  )
  fs.mkdirSync(mirrorDir, { recursive: true })

  const typeDefPath = path.join(mirrorDir, 'index.d.ts')
  writeTemplate(
    'templates/mirror-directoryNamedModule.d.ts.template',
    typeDefPath,
    {
      name,
    }
  )
  return typeDefPath
}

export const generateMirrorCells = () => {
  const rwjsPaths = getPaths()
  return findCells().map((p) => generateMirrorCell(p, rwjsPaths))
}

export const generateMirrorCell = (p: string, rwjsPaths = getPaths()) => {
  const { dir, name } = path.parse(p)

  const mirrorDir = path.join(
    rwjsPaths.generated.types.mirror,
    dir.replace(rwjsPaths.base, '')
  )
  fs.mkdirSync(mirrorDir, { recursive: true })
  const typeDefPath = path.join(mirrorDir, 'index.d.ts')
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

export const generateTypeDefGlobImports = () => {
  return writeTypeDefIncludeFile('api-globImports.d.ts.template')
}

export const generateTypeDefGlobalContext = () => {
  return writeTypeDefIncludeFile('api-globalContext.d.ts.template')
}
