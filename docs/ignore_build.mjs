// We only want Netlify to build the site if a PR changes files in this directory (./docs).
// See https://docs.netlify.com/configure-builds/ignore-builds.
// Netilfy runs this via Node.js v16.

import { execSync } from 'node:child_process'
const separator = '-'.repeat(process.stdout.columns)

function main() {
  console.log(separator)
  console.log('Running ./docs/ignore_build.js')

  const branch = process.env.BRANCH
  console.log(`Branch: ${branch}`)

  if (branch === 'main') {
    console.log(`Branch is main. Proceeding with build`)
    process.exitCode = 1
    console.log(separator)

    return
  }

  const remoteExists = execSync('git remote -v', {
    encoding: 'utf-8',
  }).includes('origin')

  if (remoteExists) {
    console.log('Remote exists')
  } else {
    console.log('Adding remote')
    execSync('git remote add origin https://github.com/redwoodjs/redwood.git')
  }

  console.log('Fetching main')
  execSync('git fetch origin main')

  console.log('Diffing changed files against main (name only)')
  const changedFiles = execSync('git diff origin/main --name-only', {
    encoding: 'utf-8',
  })
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
    console.log(
      `PR '${process.env.HEAD}' has doc changes. Proceeding with build`
    )
    process.exitCode = 1

    return
  }

  console.log(`PR '${process.env.HEAD}' doesn't have doc changes. Ignoring`)
  console.log(separator)
}

main()
