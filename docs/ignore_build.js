// We only want Netlify to build the site if a PR changes files in this `docs` directory.
// See https://docs.netlify.com/configure-builds/ignore-builds.
// Note: Netilfy runs this via Node.js 12.

const { execSync } = require('child_process')

console.group('Ignore script')

try {
  console.log('Adding remote')
  execSync('git remote add origin https://github.com/redwoodjs/redwood.git')
} catch (e) {
  if (e.error !== 'remote origin already exists') {
    throw e
  }
  console.log('Remote already exists')
}

execSync('git fetch origin main')

console.log('Diffing changed files against main (name only)')
const changedFiles = execSync('git diff origin/main --name-only')
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean)
console.log({
  changedFiles,
})

const shouldBuild = changedFiles.some((changedFile) =>
  changedFile.startsWith('docs')
)
console.log({
  shouldBuild,
})

// We've done all the logic based on whether we should build the site,
// but since this is an ignore script, we have to flip the logic here.
if (shouldBuild) {
  console.log(`${process.env.HEAD} doesn't have doc changes. Ignoring`)
  process.exitCode = 1
}
console.log(`${process.env.HEAD} has doc changes. Proceeding`)
console.groupEnd()
