import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/project-config'

export const renameApiProxyPath = () => {
  const redwoodTOMLPath = path.join(getPaths().base, 'redwood.toml')

  let redwoodTOML = fs.readFileSync(redwoodTOMLPath, 'utf8')
  redwoodTOML = redwoodTOML.replace('apiProxyPath', 'apiUrl')

  fs.writeFileSync(redwoodTOMLPath, redwoodTOML)
}
