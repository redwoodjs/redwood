// We only want Netlify to build the site if a PR changes files in this directory (./docs).
// See https://docs.netlify.com/configure-builds/ignore-builds.
// Netlify runs this via Node.js v16.

import { execSync } from 'node:child_process'

function main() {
  const branch = process.env.BRANCH

  // Reproduce the default behavior for main.
  // See https://docs.netlify.com/configure-builds/ignore-builds/#mimic-default-behavior.
  // `execSync` throws if the process times out or has a non-zero exit code.
  if (branch === 'main') {
    try {
      execSync('git diff --quiet $CACHED_COMMIT_REF $COMMIT_REF')
    } catch (error) {
      process.exitCode = 1
      return
    }
  }

  const changedFiles = execSync(
    'git diff --name-only $CACHED_COMMIT_REF $COMMIT_REF'
  )
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

  if (shouldBuild) {
    console.log(
      `PR '${process.env.HEAD}' has docs changes. Proceeding with build`
    )
    process.exitCode = 1
    return
  }

  console.log(`PR '${process.env.HEAD}' doesn't have doc changes. Ignoring`)
}

const dashes = '-'.repeat(10)

console.log(`${dashes} IGNORE BUILD START ${dashes}`)
main()
console.log(`${dashes} IGNORE BUILD END ${dashes}`)
