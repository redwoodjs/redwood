import { join, normalize } from 'path'
/**
 * Creates a file:// URL
 * Works with linux and windows paths
 * @param filePath
 */
export function URL_file(filePath: string, ...parts: string[]) {
  if (filePath.startsWith(FILE_SCHEME))
    filePath = filePath.substr(FILE_SCHEME.length)
  if (parts.length > 0) filePath = join(filePath, ...parts)
  return new URL(FILE_SCHEME + normalize(filePath)).href
}

const FILE_SCHEME = 'file://'
