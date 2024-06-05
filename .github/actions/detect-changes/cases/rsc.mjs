/**
 * Detects if there are RSC changes
 *
 * @param {string[]} changedFiles The list of files which git has listed as changed
 * @returns {boolean} True if there are changes, false if not
 */
export function rscChanged(changedFiles){
  for (const changedFile of changedFiles) {
    // As the RSC implementation changes, this list will need to be updated.
    // Also, I could be much more specific here, but then I'd also have to
    // update this list much more often. So this'll serve as a good enough
    // starting point.
    if (
      changedFile.startsWith('tasks/smoke-tests/rsc/') ||
      changedFile.startsWith('tasks/smoke-tests/rsa/') ||
      changedFile.startsWith('tasks/smoke-tests/basePlaywright.config.ts') ||
      changedFile.startsWith('.github/actions/set-up-rsa-project/') ||
      changedFile.startsWith('.github/actions/set-up-rsc-kitchen-sink-project/') ||
      changedFile.startsWith('.github/actions/set-up-rsc-project/') ||
      changedFile.startsWith('packages/internal/') ||
      changedFile.startsWith('packages/project-config/') ||
      changedFile.startsWith('packages/web/') ||
      changedFile.startsWith('packages/vite/') ||
      changedFile.startsWith('packages/router/') ||
      changedFile.startsWith('__fixtures__/test-project-rsa') ||
      changedFile.startsWith('__fixtures__/test-project-rsc-kitchen-sink')
    ) {
      console.log('RSC change detected:', changedFile)
      return true
    }
  }

  console.log('No RSC changes')
  return false
}
