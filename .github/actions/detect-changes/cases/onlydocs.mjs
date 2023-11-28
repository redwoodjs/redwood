/**
 * Detects if there are only changes to the documentation
 *
 * @param {string[]} changedFiles The list of files which git has listed as changed
 * @returns {boolean} True if there are changes, false if not
 */
export function onlyDocsChanged(changedFiles){
  for (const changedFile of changedFiles) {
    if (changedFile.startsWith('docs')) {
      continue
    }

    // CHANGE

    for (const fileToIgnore of [
      'CHANGELOG.md',
      'CODE_OF_CONDUCT.md',
      'CONTRIBUTING.md',
      'CONTRIBUTORS.md',
      'LICENSE',
      'README.md',
      'SECURITY.md',
    ]) {
      if (changedFile === fileToIgnore) {
        continue
      }
    }

    console.log('Non-docs change detected:', changedFile)
    return false
  }

  console.log('Only docs changes')
  return true
}
