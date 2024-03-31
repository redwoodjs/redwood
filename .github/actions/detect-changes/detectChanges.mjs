import fs from 'node:fs'

import core from '@actions/core'
import { onlyDocsChanges } from './cases/docs_changes.mjs'
import { onlyChangesetsChanges } from './cases/changesets_changes.mjs'
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

async function getPrBranchName() {
  const prNumber = getPrNumber()

  const url = `https://api.github.com/repos/redwoodjs/redwood/pulls/${prNumber}`
  const { json } = await fetchJson(url)

  return json?.head?.ref
}

async function getLatestCompletedWorkflowRun(branchName) {
  // 24294187 is the ID of the CI workflow (ci.yml). If it changes, or you want
  // to use a different workflow, go to
  // https://api.github.com/repos/redwoodjs/redwood/actions/workflows to ge a
  // list of all workflows and their IDs
  const workflowId = '24294187'
  const url = `https://api.github.com/repos/redwoodjs/redwood/actions/workflows/${workflowId}/runs?branch=${branchName}`
  const { json } = await fetchJson(url)

  return json?.workflow_runs?.find(run => run.status === 'completed')
}

async function getCommitsNewerThan(timestamp) {
  const prNumber = getPrNumber()

  const url = `https://api.github.com/repos/redwoodjs/redwood/pulls/${prNumber}/commits`
  const { json } = await fetchJson(url)

  const comparisonDate = new Date(timestamp)

  // Debug
  comparisonDate.setHours(comparisonDate.getHours() - 10)
  console.log('comparisonDate', comparisonDate)

  return json?.filter(commit => {
    const commitDate = new Date(commit.commit.author.date)

    return commitDate > comparisonDate
      // Debug
      // && !commit.commit.message.startsWith('Merge')
  })
}

async function getChangedFilesInCommit(commitSha) {
  console.log(`Getting changed files for commit ${commitSha}`)

  const url = `https://api.github.com/repos/redwoodjs/redwood/commits/${commitSha}`
  const { json } = await fetchJson(url)
  const changedFiles = json?.files?.map((file) => file.filename) || []

  console.log('changed files in commit', commitSha.slice(0, 6), changedFiles)

  return changedFiles
}

async function getFilesInCommits(commits) {
  let changedFiles = []
  for (let commit of commits) {
    const files = await getChangedFilesInCommit(commit.sha)
    changedFiles = changedFiles.concat(files)
  }

  return changedFiles
}

async function getChangedFilesInPr(page = 1) {
  const prNumber = getPrNumber()

  console.log(`Getting changed files for PR ${prNumber} (page ${page})`)

  // Query the GitHub API to get the changed files in the PR
  const url = `https://api.github.com/repos/redwoodjs/redwood/pulls/${prNumber}/files?per_page=100&page=${page}`
  const { json, res } = await fetchJson(url)
  let changedFiles = json?.map((file) => file.filename) || []

  // Look at the headers to see if the result is paginated
  const linkHeader = res?.headers?.get('link')
  if (linkHeader && linkHeader.includes('rel="next"')) {
    const files = await getChangedFilesInPr(page + 1)
    changedFiles = changedFiles.concat(files)
  }

  return changedFiles
}

async function fetchJson(url, retries = 0) {
  if (retries) {
    console.log(`Retry ${retries}: ${url}`)
  } else {
    console.log('Fetching', url)
  }

  const githubToken = process.env.GITHUB_TOKEN || process.env.REDWOOD_GITHUB_TOKEN

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: githubToken ? `Bearer ${githubToken}` : undefined,
        ['X-GitHub-Api-Version']: '2022-11-28',
        Accept: 'application/vnd.github+json',
      },
    })

    if (!res.ok) {
      console.log()
      console.error('Response not ok')
      console.log('res', res)
    }

    const json = await res.json()

    return { json, res }
  } catch (e) {
    if (retries >= 3) {
      console.error(e)

      console.log()
      console.log('Too many retries, giving up.')

      return {}
    } else {
      await new Promise((resolve) => setTimeout(resolve, 3000 * retries))

      const fetchJsonRes = await fetchJson(url, ++retries)
      return fetchJsonRes
    }
  }
}

// 1. Get the PR branch name
//    https://api.github.com/repos/redwoodjs/redwood/pulls/10374  .head.ref
// 2. Get CI workflow runs for that branch
//    https://api.github.com/repos/redwoodjs/redwood/actions/workflows/24294187/runs?branch=tobbe-redirect-docs
// 3. Get the `updated_at` timestamp for the newest completed run (`status` === 'completed')
// 4. Get all commits for the PR
//      https://api.github.com/repos/redwoodjs/redwood/pulls/10374/commits
// 5. Filter out all commits that are newer than the timestamp from step 3
// 6. Gather up all files changed in the commits from step 5
// 7. Use those files in the checks we do in this action

async function main() {
  const branch = process.env.GITHUB_BASE_REF

  // If there's no branch, we're not in a pull request.
  if (!branch) {
    core.setOutput('docs_only', false)
    core.setOutput('rsc', false)
    core.setOutput('ssr', false)
    return
  }

  const branchName = await getPrBranchName()
  console.log('branchName', branchName)

  const workflowRun = await getLatestCompletedWorkflowRun(branchName)

  const latestCompletionTime = workflowRun.updated_at

  const prCommits = await getCommitsNewerThan(latestCompletionTime)
  console.log('prCommits', prCommits)

  let changedFiles = await getFilesInCommits(prCommits)
  console.log('changedFiles', changedFiles)

  if (!changedFiles || changedFiles.length === 0) {
    // Probably the first commit/push to this PR, get all files
    changedFiles = await getChangedFilesInPr()
  } else {
    // `changedFiles` includes any files changed by merge commits. But if those
    // files are not part of the files this PR changes as a whole we can ignore
    // them
    const changedFilesInPr = await getChangedFilesInPr()

    changedFiles = changedFiles.filter(file => changedFilesInPr.includes(file))
    console.log('changedFiles', changedFiles)
  }

  console.log(`${changedFiles.length} changed files`)

  if (changedFiles.length === 0) {
    console.log(
      'No changed files found. Something must have gone wrong. Falling back ' +
        'to running all tests.'
    )
    core.setOutput('docs_only', false)
    core.setOutput('changesets_only', false)
    core.setOutput('rsc', true)
    core.setOutput('ssr', true)
    return
  }

  if (onlyDocsChanges(changedFiles)) {
    console.log('Only docs changes detected')
    core.setOutput('docs_only', true)
    core.setOutput('changesets_only', false)
    core.setOutput('rsc', false)
    core.setOutput('ssr', false)
    return
  }

  if (onlyChangesetsChanges(changedFiles)) {
    console.log('Only changesets changes detected')
    core.setOutput('docs_only', false)
    core.setOutput('changesets_only', true)
    core.setOutput('rsc', false)
    core.setOutput('ssr', false)
    return
  }

  core.setOutput('docs_only', false)
  core.setOutput('changesets_only', false)
  core.setOutput('rsc', rscChanged(changedFiles))
  core.setOutput('ssr', ssrChanged(changedFiles))
}

main()
