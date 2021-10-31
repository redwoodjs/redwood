import fs from 'fs'
import path from 'path'

import getRWPaths from '../../../lib/getRWPaths'

export const renameApiProxyPath = () => {
  const redwoodTOMLPath = path.join(getRWPaths().base, 'redwood.toml')

  let redwoodTOML = fs.readFileSync(redwoodTOMLPath, 'utf8')
  redwoodTOML = redwoodTOML.replace('apiProxyPath', 'apiUrl')

  fs.writeFileSync(redwoodTOMLPath, redwoodTOML)
}
