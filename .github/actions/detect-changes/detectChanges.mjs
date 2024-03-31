// @ts-check

// @ts-expect-error types
import fs from 'node:fs'

// @ts-expect-error types
import core from '@actions/core'
import { codeChanges } from './cases/code_changes.mjs'
import { rscChanged } from './cases/rsc.mjs'
import { ssrChanged } from './cases/ssr.mjs'

const BASE_URL = 'https://api.github.com/repos/redwoodjs/redwood'

const getPrNumber = () => {
  // Example GITHUB_REF refs/pull/9544/merge
  const result = /refs\/pull\/(\d+)\/merge/g.exec(process.env.GITHUB_REF)

  let prNumber = result?.[1]

  if (!prNumber) {
    try {
      // Example GITHUB_EVENT_PATH
      // /home/runner/work/_temp/_github_workflow/event.json
      const ev = JSON.parse(
        fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'),
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

/**
 * @returns {Promise<string | undefined>} the branch name for the current PR
 */
async function getPrBranchName() {
  const prNumber = getPrNumber()

  const { json } = await fetchJson(`${BASE_URL}/pulls/${prNumber}`)

  return json?.head?.ref
}

/**
 * @typedef {Object} Workflow
 * @property {string} updated_at
 *
 * @typedef {Object} Commit
 * @property {string} sha
 * @property {Object} commit
 * @property {Object} commit.author
 * @property {string} commit.author.date
 */

/**
 * @param {string | undefined} branchName
 * @returns {Promise<Workflow | undefined>}
 */
async function getLatestCompletedWorkflowRun(branchName) {
  if (!branchName) {
    return
  }

  // 24294187 is the ID of the CI workflow (ci.yml). If it changes, or you want
  // to use a different workflow, go to
  // https://api.github.com/repos/redwoodjs/redwood/actions/workflows to get a
  // list of all workflows and their IDs
  const workflowId = '24294187'
  const url = `${BASE_URL}/actions/workflows/${workflowId}/runs?branch=${branchName}`
  const { json } = await fetchJson(url)

  return json?.workflow_runs?.find((run) => run.status === 'completed')
}

/**
 * @param {string | undefined} timestamp
 * @return {Promise<Commit[] | undefined>}
 */
async function getCommitsNewerThan(timestamp) {
  if (!timestamp) {
    return
  }

  const prNumber = getPrNumber()

  const { json } = await fetchJson(`${BASE_URL}/pulls/${prNumber}/commits`)

  const comparisonDate = new Date(timestamp)

  return json?.filter((/** @type Commit */ commit) => {
    return new Date(commit.commit.author.date) > comparisonDate
  })
}

/**
 * @param {string} commitSha
 * @return {Promise<string[]>}
 */
async function getChangedFilesInCommit(commitSha) {
  const { json } = await fetchJson(`${BASE_URL}/commits/${commitSha}`)
  const changedFiles = json?.files?.map((file) => file.filename) || []

  return changedFiles
}

/**
 * @param {Commit[] | undefined} commits
 * @return {Promise<string[]>}
 */
async function getFilesInCommits(commits) {
  let changedFiles = []
  for (let commit of commits || []) {
    const files = await getChangedFilesInCommit(commit.sha)
    changedFiles = changedFiles.concat(files)
  }

  return changedFiles
}

async function getChangedFilesInPr(page = 1) {
  const prNumber = getPrNumber()

  console.log(`Getting changed files for PR ${prNumber} (page ${page})`)

  // Query the GitHub API to get the changed files in the PR
  const url = `${BASE_URL}/pulls/${prNumber}/files?per_page=100&page=${page}`
  const { json, res } = await fetchJson(url)

  console.log('getChangedFilesInPr json', json)

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

  const githubToken =
    process.env.GITHUB_TOKEN || process.env.REDWOOD_GITHUB_TOKEN

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

// We want to get the list of changed files since the last "git push" to this
// PR. But there is no good way to know when that last "push" happened. GitHub
// only gives you the full list of commits, there's no way of knowing what
// "push" they belong to.
// But every time a "push" happens to a PR branch a new CI run starts. So by
// looking at when the last completed CI run ended, and comparing that to the
// timestamps of all commits, we can figure out what commits are new, and what
// commits we've already run CI for
//
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
    core.setOutput('changesets_only', false)
    core.setOutput('rsc', false)
    core.setOutput('ssr', false)
    return
  }

  const branchName = await getPrBranchName()
  const workflowRun = await getLatestCompletedWorkflowRun(branchName)
  const prCommits = await getCommitsNewerThan(workflowRun?.updated_at)
  let changedFiles = await getFilesInCommits(prCommits)

  if (changedFiles.length === 0) {
    // Probably the first commit/push to this PR - get all files
    // (Or something went wrong, in which case we also want to just get all
    // files)
    changedFiles = await getChangedFilesInPr()
  } else {
    // `changedFiles` includes any files changed by merge commits. But if those
    // files are not part of the files this PR changes as a whole we can ignore
    // them
    const changedFilesInPr = await getChangedFilesInPr()

    changedFiles = changedFiles.filter((file) =>
      changedFilesInPr.includes(file),
    )
  }

  console.log(`${changedFiles.length} changed files`)

  if (changedFiles.length === 0) {
    console.log(
      'No changed files found. Something must have gone wrong. Falling back ' +
        'to running all tests.',
    )
    core.setOutput('code', false)
    core.setOutput('rsc', true)
    core.setOutput('ssr', true)
    return
  }

  if (!codeChanges(changedFiles)) {
    console.log('Only docs and/or changesets changes detected')
    core.setOutput('code', false)
    core.setOutput('rsc', false)
    core.setOutput('ssr', false)
    return
  }

  core.setOutput('code', true)
  core.setOutput('rsc', rscChanged(changedFiles))
  core.setOutput('ssr', ssrChanged(changedFiles))
}

main()
