import { basename, sep, normalize } from 'path'

export function directoryNameResolver(dirName: string): string {
  dirName = normalize(dirName)
  const parts = dirName.split(sep)
  const pp = parts[parts.length - 1]
  parts.push(pp)
  return parts.join(sep) + '.js'
}

export function followsDirNameConvention(filePath: string): boolean {
  filePath = normalize(filePath)
  const ending = basenameNoExt(filePath) + sep + basename(filePath)
  return filePath.endsWith(ending)
}

export function basenameNoExt(path: string): string {
  path = normalize(path)
  const parts = basename(path).split('.')
  if (parts.length > 1) parts.pop()
  return parts.join('.')
}

export function isLayoutFileName(f: string): boolean {
  f = normalize(f)
  return basenameNoExt(f).endsWith('Layout')
}

export function isCellFileName(f: string): boolean {
  f = normalize(f)
  return basenameNoExt(f).endsWith('Cell')
}
