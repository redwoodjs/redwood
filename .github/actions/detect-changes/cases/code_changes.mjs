/** Detects if the given file path points to a docs file */
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
 * Checks if the given filepath points to a markdown file in the
 * /.changesets/ directory
 */
export function isChangesetsFile(filePath) {
  return /^\.changesets\/.*\.md/.test(filePath)
}

/**
 * Checks if the given array of file paths contains any framework code files
 */
export function codeChanges(changedFiles) {
  return changedFiles.some((file) => {
    if (!isDocsFile(file) && !isChangesetsFile(file)) {
      console.log(`Found potential code file: ${file}`)
      return true
    }

    return false
  })
}
