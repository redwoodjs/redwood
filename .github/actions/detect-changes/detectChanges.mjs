import fs from 'node:fs'

import core from '@actions/core'
import { exec, getExecOutput } from '@actions/exec'
import { onlyDocsChanged } from './cases/onlydocs.mjs'
import { rscChanged } from './cases/rsc.mjs'
import { ssrChanged } from './cases/ssr.mjs'

const getPrNumber = (githubRef) => {
  // Example GITHUB_REF refs/pull/9544/merge
  const result = /refs\/pull\/(\d+)\/merge/g.exec(process.env.GITHUB_REF)

  let prNumber = result?.[1]

  if (!prNumber) {
    try {
      // Example GITHUB_EVENT_PATH
      // /home/runner/work/_temp/_github_workflow/event.json
      const ev = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
      prNumber = ev.pull_request?.number
    } catch {
      // fall through
    }
  }

  if (!prNumber) {
    throw new Error('Could not find the PR number')
  }

  return prNumber
}

async function getChangedFiles(page = 1) {
  const prNumber = getPrNumber()

  console.log(
    `Getting changed files (${page}) for PR ${process.env.GITHUB_BASE_REF}`
  )
  let changedFiles = []

  // Query the GitHub API to get the changed files in the PR
  const githubToken = process.env.GITHUB_TOKEN
  const url = `https://api.github.com/repos/redwoodjs/redwood/pulls/${prNumber}/files?per_page=1&page=${page}`
  const resp = await fetch(url, {
    headers: {
      Authorization: githubToken ? `Bearer ${githubToken}` : undefined,
      ['X-GitHub-Api-Version']: '2022-11-28',
      Accept: 'application/vnd.github+json',
    },
  })

  console.log({ resp })
  const json = await resp.json()
  const files = json.map((file) => file.filename) || []
  console.log({ files })

  changedFiles = changedFiles.concat(files)

  // Look at the headers to see if the result is paginated
  const linkHeader = resp.headers.get('link')
  if (linkHeader && linkHeader.includes('rel="next"')) {
    const nextChangedFiles = await getChangedFiles(page + 1)
    console.log({ nextChangedFiles })
    changedFiles = changedFiles.concat(nextChangedFiles)
  }

  return changedFiles
}

async function main() {
  const branch = process.env.GITHUB_BASE_REF

  // If there's no branch, we're not in a pull request.
  if (!branch) {
    core.setOutput('onlydocs', false)
    core.setOutput('rsc', false)
    core.setOutput('ssr', false)
    return
  }

  const changedFiles = await getChangedFiles()
  console.log(`${changedFiles.length} changed files`)

  const onlyDocs = onlyDocsChanged(changedFiles)
  if (onlyDocs) {
    core.setOutput('onlydocs', true)
    core.setOutput('rsc', false)
    core.setOutput('ssr', false)
    return
  }

  core.setOutput('onlydocs', false)
  core.setOutput('rsc', rscChanged(changedFiles))
  core.setOutput('ssr', ssrChanged(changedFiles))
}

main()
