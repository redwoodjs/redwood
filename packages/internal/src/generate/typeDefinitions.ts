import fs from 'fs'
import path from 'path'

import { findCells, findDirectoryNamedModules } from 'src/findFiles'
import { getJsxElements } from 'src/jsx'
import { getPaths, processPagesDir } from 'src/paths'

import { writeTemplate } from './templates'

// TODO: We generate some types as part of the transpilation process.
// Those should be removed and placed over here.
export const generateTypeDefs = () => {
  const p1 = generateDirectoryNamedModuleTypeDefs()
  const p2 = generateCellTypesDefs()
  const p3 = generateRouterPageImports()
  const p4 = generateCurrentUserTypeDef()
  const p5 = generateRouterRoutesTypeDef()

  return [...p1, ...p2, p3[0], p4[0], p5[0]]
}

export const generateRouterPageImports = () => {
  const pages = processPagesDir()
  const rwjsPaths = getPaths()
  const typeDefPath = path.join(rwjsPaths.types, 'web-global-pages.d.ts')
  writeTemplate('templates/web-global-pages.d.ts.template', typeDefPath, {
    pages,
  })
  return [typeDefPath]
}

export const generateCurrentUserTypeDef = () => {
  const rwjsPaths = getPaths()
  const typeDefPath = path.join(rwjsPaths.types, 'currentUser.d.ts')
  writeTemplate('templates/currentUser.d.ts.template', typeDefPath)
  return [typeDefPath]
}

export const generateRouterRoutesTypeDef = () => {
  const rwjsPaths = getPaths()

  const code = fs.readFileSync(rwjsPaths.web.routes, 'utf-8')
  const routes = getJsxElements(code, 'Route').filter((x) => {
    // All generated "routes" should have a name and path value
    return (
      typeof x.props?.path !== 'undefined' &&
      typeof x.props?.name !== 'undefined'
    )
  })

  const typeDefPath = path.join(rwjsPaths.types, 'routerRoutes.d.ts')
  writeTemplate('templates/routerRoutes.d.ts.template', typeDefPath, { routes })
  return [typeDefPath]
}

export const generateDirectoryNamedModuleTypeDefs = () => {
  const rwjsPaths = getPaths()
  const paths = findDirectoryNamedModules()

  return paths.map((p) => {
    const { dir, name } = path.parse(p)

    const mirrorDir = path.join(
      rwjsPaths.mirror,
      dir.replace(rwjsPaths.base, '')
    )
    fs.mkdirSync(mirrorDir, { recursive: true })

    const typeDefPath = path.join(mirrorDir, 'index.d.ts')
    writeTemplate('templates/directoryNamedModule.d.ts.template', typeDefPath, {
      name,
    })
    return typeDefPath
  })
}

export const generateCellTypesDefs = () => {
  const rwjsPaths = getPaths()
  const paths = findCells()

  return paths.map((p) => {
    const { dir, name } = path.parse(p)

    const mirrorDir = path.join(
      rwjsPaths.mirror,
      dir.replace(rwjsPaths.base, '')
    )
    fs.mkdirSync(mirrorDir, { recursive: true })

    const typeDefPath = path.join(mirrorDir, 'index.d.ts')
    writeTemplate('templates/cell.d.ts.template', typeDefPath, { name })

    return typeDefPath
  })
}
