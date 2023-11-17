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

  // Ensure we know the latest changes on the main branch
  execSync('git fetch origin main')

  // TODO: Remove this:
  console.log('---')
  console.log('BRANCH', process.env.BRANCH)
  console.log('HEAD', process.env.HEAD)
  console.log('COMMIT_REF', process.env.COMMIT_REF)
  console.log('CACHED_COMMIT_REF', process.env.CACHED_COMMIT_REF)
  console.log('main', execSync('git rev-parse main').toString())
  console.log('origin/main', execSync('git rev-parse origin/main').toString())
  console.log('---')

  // Compare the changes between the main branch and the current commit
  const changedFiles = execSync('git diff --name-only origin/main $COMMIT_REF')
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean)

  console.log({
    changedFiles,
  })

  const docFilesChanged = changedFiles.filter((changedFile) =>
    changedFile.startsWith('docs')
  )
  console.log({
    docFilesChanged,
  })

  if (docFilesChanged.length > 0) {
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
