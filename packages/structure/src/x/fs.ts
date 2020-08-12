import { Host, DefaultHost } from 'src/ide'
import os from 'os'

/**
 * Ensures that the contents appended to the file are unique.
 */
export const appendFileUnique = (
  path: string,
  contents: any,
  host: Host = new DefaultHost()
) => {
  const oldContents = host.readFileSync(path)
  if (oldContents.includes(contents)) {
    return
  }
  host.appendFileSync && host.appendFileSync(path, contents)
}
