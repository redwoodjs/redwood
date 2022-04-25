// We only want Netlify to build the site if a PR changes files in this `docs` directory.
// See https://docs.netlify.com/configure-builds/ignore-builds.
// Note: Netilfy runs this via Node.js 12.

const { execSync } = require('child_process')

console.log(process.env)

console.log('fetching origin main')
execSync('git fetch origin main')

console.log('dffing origin main')
const changedFiles = execSync('git diff origin/main --name-only')
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean)

const shouldBuild = changedFiles.some((changedFile) =>
  changedFile.startsWith('docs')
)

// We've done all the logic based on whether we should build the site,
// but since this is an ignore script, we have to flip the logic here.
if (shouldBuild) {
  process.exitCode = 1
}
