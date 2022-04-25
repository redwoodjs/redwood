// We only want Netlify to build the site if a PR changes files in this `docs` directory.
// See https://docs.netlify.com/configure-builds/ignore-builds.
// Note: Netilfy runs this via Node.js 12.

const { execSync } = require('child_process')

execSync('git fetch origin main')

const changedFiles = execSync('git diff origin/main --name-only')
  .toString()
  .trim()
  .split('\n')
  .filter(Boolean)

const shouldBuild = changedFiles.some((changedFile) =>
  changedFile.startsWith('docs')
)

if (!shouldBuild) {
  process.exitCode = 1
}
