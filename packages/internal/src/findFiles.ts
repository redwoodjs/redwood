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
    .filter(Boolean)
}
