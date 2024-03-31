/**
 * Detects if the given file path points to a code file (as apposed to a docs
 * file)
 */
function isDocsFile(filePath) {
  if (filePath.startsWith('docs')) {
    return true
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
    return true
  }

  return false
}

/**
 * Checks if the given array of file paths contains any files with potential
 * code changes
 */
export function onlyDocsChanges(changedFiles) {
  return changedFiles.every((file) => {
    if (isDocsFile(file)) {
      return true
    }

    console.log(`Found non-docs file: ${file}`)
    return false
  })
}
