import fs from 'fs'
import path from 'path'

import getRWPaths from '../../../lib/getRWPaths'

export const updateNodeEngine = () => {
  const rwPaths = getRWPaths()

  const rootPackageJSONPath = path.join(rwPaths.base, 'package.json')

  const rootPackageJSON = JSON.parse(
    fs.readFileSync(rootPackageJSONPath, 'utf8')
  )

  rootPackageJSON.engines.node = '>=14.x <=16.x'

  fs.writeFileSync(
    rootPackageJSONPath,
    JSON.stringify(rootPackageJSON, null, 2) + '\n'
  )
}
