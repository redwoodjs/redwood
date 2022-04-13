import fs from 'fs'

import getRootPackageJSON from '../../../lib/getRootPackageJSON'

export const addTypesReactResolution = () => {
  const [rootPackageJSON, rootPackageJSONPath] = getRootPackageJSON()

  rootPackageJSON.resolutions = rootPackageJSON.resolutions || {}
  rootPackageJSON.resolutions['@types/react'] = '17.0.40'

  fs.writeFileSync(
    rootPackageJSONPath,
    JSON.stringify(rootPackageJSON, null, 2) + '\n'
  )
}
