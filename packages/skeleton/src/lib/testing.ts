import { ensurePosixPath } from '@redwoodjs/internal/dist/paths'

export function stripAndFormatPathForTesting(
  filepath: string,
  projectFilepath: string
) {
  if (filepath.startsWith(projectFilepath)) {
    filepath = ensurePosixPath(filepath.substring(projectFilepath.length))
  }
  return filepath
}
