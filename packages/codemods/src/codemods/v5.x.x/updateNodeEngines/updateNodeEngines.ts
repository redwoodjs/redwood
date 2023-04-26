import fs from 'fs'
import path from 'path'

import getRWPaths from '../../../lib/getRWPaths'

async function updateNodeEngines() {
  const packageJSONPath = path.join(getRWPaths().base, 'package.json')
  const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'))

  packageJSON.engines.node = '=18.x'

  fs.writeFileSync(packageJSONPath, JSON.stringify(packageJSON, null, 2))
}

export { updateNodeEngines }
