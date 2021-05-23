import fs from 'fs'
import path from 'path'

import fg from 'fast-glob'

import { getNamedExports, hasDefaultExport } from './ast'
import { getPaths } from './paths'

/**
 * Find all the Cell files in the web side.
 */
export const findCells = (webSrcDir: string = getPaths().web.src) => {
  const modules = fg.sync('**/*Cell.{js,jsx,ts,tsx}', {
    cwd: webSrcDir,
    ignore: ['node_modules'],
  })

  return modules
    .map((p) => path.join(webSrcDir, p))
    .map((p) => {
      // A Cell must be a directory named module.
      const { dir, name } = path.parse(p)
      if (!dir.endsWith(name)) {
        return false
      }

      const code = fs.readFileSync(p, 'utf-8')

      // A Cell should not have a default export.
      if (hasDefaultExport(code)) {
        return false
      }

      // A Cell must export QUERY and Success.
      const exports = getNamedExports(code)
      const exportedQUERY = exports.findIndex((v) => v.name === 'QUERY') !== -1
      const exportedSuccess =
        exports.findIndex((v) => v.name === 'Success') !== -1
      if (!exportedQUERY && !exportedSuccess) {
        return false
      }

      return p
    })
    .filter(Boolean) as string[]
}

/**
 * Find all the directory named module files.
 */
export const findDirectoryNamedModules = (
  projectBaseDir: string = getPaths().base
) => {
  const modules = fg.sync('**/src/**/*[!Cell].{ts,js,jsx,tsx}', {
    cwd: projectBaseDir,
    ignore: ['node_modules'],
  })

  return modules
    .map((p) => {
      const { dir, name } = path.parse(p)
      if (!dir.endsWith(name)) {
        return false
      }
      return path.join(projectBaseDir, p)
    })
    .filter(Boolean) as string[]
}
