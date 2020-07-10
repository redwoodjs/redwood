export { DefaultHost, Host } from './ide'
export { RWProject } from './model'
import { DefaultHost } from './ide'
import { RWProject } from './model'

export function getProject(projectRoot: string, host = new DefaultHost()) {
  return new RWProject({
    projectRoot,
    host,
  })
}
