import fs from 'fs'
import { createRequire } from 'module'
import path from 'path'

import { format } from 'prettier'
import tempy from 'tempy'

const requireFromPrettier = createRequire(require.resolve('prettier'))
const babelParser = requireFromPrettier('./parser-babel.js')

export const formatCode = (code: string) => {
  return format(code, {
    parser: 'babel-ts',
    plugins: [babelParser],
  })
}

export const createProjectMock = () => {
  const tempDir = tempy.directory()
  // add fake redwood.toml
  fs.closeSync(fs.openSync(path.join(tempDir, 'redwood.toml'), 'w'))

  return tempDir
}
