/**
 * Detects if the given file path points to a code file (as apposed to a docs
 * file)
 */
function isCodeFile(filePath) {
  if (filePath.startsWith('docs')) {
    return false
  }

  if (
    [
      'CHANGELOG.md',
      'CODE_OF_CONDUCT.md',
      'CONTRIBUTING.md',
      'CONTRIBUTORS.md',
      'LICENSE',
      'README.md',
      'SECURITY.md',
    ].includes(filePath)
  ) {
    return false
  }

  return true
}

/**
 * Checks if the given array of file paths contains any files with potential
 * code changes
 */
export function hasCodeChanges(changedFiles) {
  return changedFiles.some((file) => {
    if (isCodeFile(file)) {
      console.log(`Found code file: ${file}`)
      return true
    }

    return false
  })
}
