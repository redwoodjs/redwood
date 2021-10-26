import fs from 'fs'
import path from 'path'

import getRWPaths from '../../../lib/getRWPaths'

export const renameApiProxyPath = () => {
  const rwPaths = getRWPaths()
  const redwoodTOMLPath = path.join(rwPaths.base, 'redwood.toml')
  let redwoodTOML = fs.readFileSync(redwoodTOMLPath, 'utf8')
  redwoodTOML = redwoodTOML.replace('apiProxyPath', 'apiURL')
  fs.writeFileSync(redwoodTOMLPath, redwoodTOML)
}
