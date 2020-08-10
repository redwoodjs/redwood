import { isAbsolute, join, normalize } from 'path'
import { parse } from 'url'
/**
 * Creates a file:// URL
 * Works with linux and windows paths
 * If the passed in value is already as file:// URL, it returns that same value
 * TOOD: rename to URL_fromFile
 * @param filePath
 */
export function URL_file(filePath: string, ...parts: string[]): string {
  if (filePath.startsWith(FILE_SCHEME))
    filePath = filePath.substr(FILE_SCHEME.length)
  if (parts.length > 0) filePath = join(filePath, ...parts)
  return new URL(FILE_SCHEME + normalize(filePath)).href
}

/**
 *
 * @param uriOrFilePath
 */
export function URL_toFile(uriOrFilePath: string): string {
  if (typeof uriOrFilePath !== 'string') throw new Error('arg error')
  if (uriOrFilePath.startsWith(FILE_SCHEME))
    return URL_toFile(parse(uriOrFilePath)!.path!)
  const p = normalize(uriOrFilePath)
  if (!isAbsolute(p)) throw new Error('absolut path expected: ' + p)
  return p!
}

const FILE_SCHEME = 'file://'
