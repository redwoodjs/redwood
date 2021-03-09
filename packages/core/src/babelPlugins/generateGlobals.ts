import path from 'path'

import { DefaultHost } from '@redwoodjs/structure'

/**
 * Generate a globals definition
 */
export const generateGlobalsDef = (filename: string, contents: string) => {
  const host = new DefaultHost()
  host.writeFileSync(path.join(host.paths.globals, filename), contents)
}
