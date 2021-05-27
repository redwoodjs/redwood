import path from 'path'

import { getProject } from '@redwoodjs/structure'

const project = getProject()

export function generateTypeDef(filename, templatePath) {
  const { host } = project
  host.writeFileSync(
    path.join(host.paths.types, filename),
    project.host.readFileSync(templatePath)
  )
}
