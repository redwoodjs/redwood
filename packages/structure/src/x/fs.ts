import { Host, DefaultHost } from '../ide'

/**
 * Ensures that the contents appended to the file are unique.
 */
export const appendFileUnique = (
  path: string,
  contents: any,
  host: Host = new DefaultHost()
) => {
  let oldContents = ''
  if (host.existsSync(path)) {
    console.log('file does exits.')
    oldContents = host.readFileSync(path)
  }

  // already has this content, abort.
  if (oldContents.includes(contents)) {
    return
  }
  host.appendFileSync && host.appendFileSync(path, contents)
}
