import { ensurePosixPath } from '@redwoodjs/project-config'

export function stripAndFormatPathForTesting(
  filepath: string,
  projectFilepath: string
) {
  if (filepath.startsWith(projectFilepath)) {
    filepath = ensurePosixPath(filepath.substring(projectFilepath.length))
  }
  return filepath
}
