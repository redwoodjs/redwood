import { basename } from 'path'

export function directoryNameResolver(dirName: string): string {
  const parts = dirName.split('/')
  const pp = parts[parts.length - 1]
  parts.push(pp)
  return parts.join('/') + '.js'
}

export function followsDirNameConvention(filePath: string): boolean {
  const ending = basenameNoExt(filePath) + '/' + basename(filePath)
  return filePath.endsWith(ending)
}

export function basenameNoExt(path: string): string {
  const parts = basename(path).split('.')
  if (parts.length > 1) parts.pop()
  return parts.join('.')
}

export function isLayoutFileName(f: string): boolean {
  return basenameNoExt(f).endsWith('Layout')
}

export function isCellFileName(f: string): boolean {
  return basenameNoExt(f).endsWith('Cell')
}
