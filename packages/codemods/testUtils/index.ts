import fs from 'fs'
import path from 'path'

import { format } from 'prettier'
import tempy from 'tempy'

export const formatCode = (code: string) => {
  return format(code, { parser: 'babel-ts' })
}

export const createProjectMock = () => {
  const tempDir = tempy.directory()

  // // Override paths,
  process.env.RWJS_CWD = tempDir
  // // and add fake redwood.toml
  fs.closeSync(fs.openSync(path.join(tempDir, 'redwood.toml'), 'w'))

  return tempDir
}
