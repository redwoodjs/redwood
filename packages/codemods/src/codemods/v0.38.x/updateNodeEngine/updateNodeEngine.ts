import fs from 'fs'

import getRootPackageJSON from '../../../lib/getRootPackageJSON'

export const updateNodeEngine = () => {
  const [rootPackageJSON, rootPackageJSONPath] = getRootPackageJSON()

  rootPackageJSON.engines.node = '>=14.x <=16.x'

  fs.writeFileSync(
    rootPackageJSONPath,
    JSON.stringify(rootPackageJSON, null, 2) + '\n'
  )
}
