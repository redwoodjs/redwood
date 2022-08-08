// We only want Netlify to build the site if a PR changes files in this `docs` directory.
// See https://docs.netlify.com/configure-builds/ignore-builds.
// Note: Netilfy runs this via Node.js 12.

const { execSync } = require('child_process')

console.log('------------------------')
console.log("Running 'docs/ignore_build.js'")

console.log({
  branch: process.env.BRANCH,
})

if (process.env.BRANCH === 'main') {
  console.log(`Branch is main. Proceeding`)
  process.exitCode = 1
  console.log('------------------------')
} else {
  const remoteExists = execSync('git remote -v').toString().includes('origin')

  if (remoteExists) {
    console.log('Remote exists')
  } else {
    console.log('Adding remote')
    execSync('git remote add origin https://github.com/redwoodjs/redwood.git')
  }

  console.log('Fetching main')
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
    console.log(`PR '${process.env.HEAD}' has doc changes. Proceeding`)
    process.exitCode = 1
  } else {
    console.log(`PR '${process.env.HEAD}' doesn't have doc changes. Ignoring`)
  }
  console.log('------------------------')
}
