// We only want Netlify to build the site if a PR changes files in this directory (./docs).
// See https://docs.netlify.com/configure-builds/ignore-builds.
// Netlify runs this via Node.js v16.

import { execSync } from 'node:child_process'

async function main() {
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

  // Query the GithHub API to get the changed files in the PR
  const url = `https://api.github.com/repos/redwoodjs/redwood/pulls/${process.env.REVIEW_ID}/files?per_page=100`
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.RW_GITHUB_TOKEN}`,
      ['X-GitHub-Api-Version']: '2022-11-28',
      Accept: 'application/vnd.github+json',
    },
  })
  const json = await resp.json()
  const changedFiles = json.map((file) => file.filename)

  console.log({
    changedFiles,
  })

  const docFilesChanged = changedFiles.filter((changedFile) =>
    changedFile.startsWith('docs')
  )
  console.log({
    docFilesChanged,
  })

  // We don't handle pagination here. If there are more than 100 changed files,
  // we assume that there are docs changes.
  if (docFilesChanged.length > 0 || changedFiles.length >= 100) {
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
main().finally(() => {
  console.log(`${dashes} IGNORE BUILD END ${dashes}`)
})
