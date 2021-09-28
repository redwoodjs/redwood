import execa from 'execa'
import { rgPath } from 'vscode-ripgrep'

const getFilesWithPattern = ({
  pattern,
  filesToSearch,
}: {
  pattern: string
  filesToSearch: string[]
}) => {
  try {
    const { stdout } = execa.sync(rgPath, [
      '--files-with-matches',
      pattern,
      ...filesToSearch,
    ])

    return stdout.toString().split('\n')
  } catch (e) {
    return []
  }
}

export default getFilesWithPattern
