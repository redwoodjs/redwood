import { pathToFileURL } from 'node:url'

import { fs, path } from 'zx'

export function projectFileExists({
  projectPath,
  filePath,
}: {
  projectPath: string
  filePath: string
}): boolean {
  const exists = fs.existsSync(path.join(projectPath, filePath))
  if (!exists) {
    return false
  }
  return fs.statSync(path.join(projectPath, filePath)).isFile()
}

export function projectDirectoryExists({
  projectPath,
  directoryPath,
}: {
  projectPath: string
  directoryPath: string
}): boolean {
  const exists = fs.existsSync(path.join(projectPath, directoryPath))
  if (!exists) {
    return false
  }
  return fs.statSync(path.join(projectPath, directoryPath)).isDirectory()
}

export function makeFilePath(path: string) {
  return pathToFileURL(path).href
}
