import fs from 'fs'
import path from 'path'

import { glob } from 'glob'

import { getNamedExports } from './ast'
import { getPaths } from './paths'

/**
 * Find all the Cell components in a project's web-side.
 */
export const findCells = (webSrcDir: string = getPaths().web.src) => {
  const cellPaths = glob.sync('**/*Cell.{js,jsx,ts,tsx}', {
    cwd: webSrcDir,
  })

  return cellPaths
    .map((p) => path.join(webSrcDir, p))
    .map((p) => {
      const code = fs.readFileSync(p, 'utf-8')
      const exports = getNamedExports(code)
      const exportedQUERY = exports.findIndex((v) => v.name === 'QUERY') !== -1 //?
      const exportedSuccess =
        exports.findIndex((v) => v.name === 'Success') !== -1 //?
      if (exportedQUERY && exportedSuccess) {
        return p
      }
      return false
    })
    .filter(Boolean) as string[]
}

/**
 * Find all the directory named modules.
 *
 * @todo measure how performant this code is.
 */
export const findDirectoryNamedModules = (
  projectBaseDir: string = getPaths().base
) => {
  const modules = glob.sync('**/*.{ts,js,jsx,tsx}', { cwd: projectBaseDir })
  return modules
    .map((m) => {
      const { dir, name } = path.parse(m)
      if (!dir.endsWith(name)) {
        return false
      }
      return path.join(projectBaseDir, m)
    })
    .filter(Boolean) as string[]
}
