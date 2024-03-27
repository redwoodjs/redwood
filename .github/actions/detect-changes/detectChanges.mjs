import fs from 'node:fs'

import core from '@actions/core'
import { hasCodeChanges } from './cases/code_changes.mjs'
import { rscChanged } from './cases/rsc.mjs'
import { ssrChanged } from './cases/ssr.mjs'

const getPrNumber = () => {
  // Example GITHUB_REF refs/pull/9544/merge
  const result = /refs\/pull\/(\d+)\/merge/g.exec(process.env.GITHUB_REF)

  let prNumber = result?.[1]

  if (!prNumber) {
    try {
      // Example GITHUB_EVENT_PATH
      // /home/runner/work/_temp/_github_workflow/event.json
      const ev = JSON.parse(
        fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')
      )
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

async function getChangedFiles(page = 1, retries = 0) {
  const prNumber = getPrNumber()

  if (retries) {
    console.log(
      `Retry ${retries}: Getting changed files for PR ${prNumber} (page ${page})`
    )
  } else {
    console.log(`Getting changed files for PR ${prNumber} (page ${page})`)
  }

  let changedFiles = []

  // Query the GitHub API to get the changed files in the PR
  const githubToken = process.env.GITHUB_TOKEN
  const url = `https://api.github.com/repos/redwoodjs/redwood/pulls/${prNumber}/files?per_page=100&page=${page}`
  let resp
  let files = []

  try {
    resp = await fetch(url, {
      headers: {
        Authorization: githubToken ? `Bearer ${githubToken}` : undefined,
        ['X-GitHub-Api-Version']: '2022-11-28',
        Accept: 'application/vnd.github+json',
      },
    })

    if (!resp.ok) {
      console.log()
      console.error('Response not ok')
      console.log('resp', resp)
    }

    const json = await resp.json()
    files = json.map((file) => file.filename) || []
  } catch (e) {
    if (retries >= 3) {
      console.error(e)

      console.log()
      console.log('Too many retries, giving up.')

      return []
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000 * retries))
      files = await getChangedFiles(page, ++retries)
    }
  }

  changedFiles = changedFiles.concat(files)

  // Look at the headers to see if the result is paginated
  const linkHeader = resp.headers.get('link')
  if (linkHeader && linkHeader.includes('rel="next"')) {
    const files = await getChangedFiles(page + 1)
    changedFiles = changedFiles.concat(files)
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

  if (changedFiles.length === 0) {
    console.log(
      'No changed files found. Something must have gone wrong. Falling back ' +
        'to running all tests.'
    )
    core.setOutput('onlydocs', false)
    core.setOutput('rsc', true)
    core.setOutput('ssr', true)
    return
  }

  if (!hasCodeChanges(changedFiles)) {
    console.log('No code changes detected, only docs')
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
