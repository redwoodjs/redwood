/**
 * Detects if there are SSR changes
 *
 * @param {string[]} changedFiles The list of files which git has listed as changed
 * @returns {boolean} True if there are changes, false if not
 */
export function ssrChanged(changedFiles){
  for (const changedFile of changedFiles) {
    if (
      changedFile.startsWith('tasks/smoke-tests/streaming-ssr') ||
      changedFile === 'tasks/smoke-tests/basePlaywright.config.ts' ||
      changedFile === 'tasks/test-project/codemods/delayedPage.js' ||
      changedFile.startsWith('packages/internal/') ||
      changedFile.startsWith('packages/project-config/') ||
      changedFile.startsWith('packages/web/') ||
      changedFile.startsWith('packages/router/') ||
      changedFile.startsWith('packages/web-server/') ||
      changedFile.startsWith('packages/vite/')
    ) {
      console.log('SSR change detected:', changedFile)
      return true
    }
  }

  console.log('No SSR changes')
  return false
}
