import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/cli-helpers'

export const sides = () => {
  const paths = getPaths()

  let sides = []
  if (fs.existsSync(path.join(paths.web.base, 'package.json'))) {
    sides = [...sides, 'web']
  }
  if (fs.existsSync(path.join(paths.api.base, 'package.json'))) {
    sides = [...sides, 'api']
  }
  return sides
}
