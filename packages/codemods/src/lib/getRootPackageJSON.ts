import fs from 'fs'
import path from 'path'

import getRWPaths from './getRWPaths'

const getRootPackageJSON = () => {
  const rootPackageJSONPath = path.join(getRWPaths().base, 'package.json')

  const rootPackageJSON = JSON.parse(
    fs.readFileSync(rootPackageJSONPath, 'utf8')
  )

  return [rootPackageJSON, rootPackageJSONPath]
}

export default getRootPackageJSON
