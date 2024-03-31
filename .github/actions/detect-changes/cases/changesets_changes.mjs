/**
 * Checks if only one file is changed, and that it's a markdown file in
 * /.changesets/
 */
export function onlyChangesetsChanges(changedFiles) {
  return (
    changedFiles.length === 1 && /^\.changesets\/.*\.md/.test(changedFiles[0])
  )
}
