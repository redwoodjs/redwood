import { fileURLToPath } from 'node:url'

import { humanId } from 'human-id'
import type { ProcessPromise } from 'zx'
import { $, argv, path, fs } from 'zx'

const ROOT_DIR_PATH = fileURLToPath(new URL('../../', import.meta.url))
const DIRNAME = path.dirname(fileURLToPath(new URL(import.meta.url)))
const CHANGESETS_DIR = path.join(ROOT_DIR_PATH, '.changesets')

export function showHelp() {
  console.log(`\
Usage: yarn changesets [prNumber]

  prNumber: A PR number. If provided, the changeset will use the PR's title and body as its placeholder.

  Examples:
    yarn changesets                                                  # Tries to determine the PR based on the current branch name.
                                                                     # If no PR is found, it uses the default placeholder.
    yarn changesets 10075                                            # Create a changeset with PR 10075's title and body.
`)
}

export function getChangesetFilePath(prNumber?: number) {
  let changesetId

  if (prNumber) {
    changesetId = prNumber
  } else {
    changesetId = humanId({
      separator: '-',
      capitalize: false,
    })
  }

  return path.join(CHANGESETS_DIR, `${changesetId}.md`)
}

export async function getPlaceholder(prNumber?: number) {
  if (prNumber) {
    return getPrPlaceholderByNumber(prNumber)
  }

  return getDefaultPlaceholder()
}

export async function resolveArgv() {
  const maybePrNumber = argv._[0]
  if (!maybePrNumber) {
    const currentBranch = await getStdout($`git branch --show-current`)

    const url =
      'https://api.github.com/repos/redwoodjs/redwood/pulls?state=open&sort=updated&direction=desc&per_page=100'
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getGitHubToken()}`,
        ['X-GitHub-Api-Version']: '2022-11-28',
        Accept: 'application/vnd.github+json',
      },
    })
    const prs = await res.json()
    const pr = prs.find(
      (pr: { head: { ref: string } }) => pr.head.ref === currentBranch,
    )

    return { prNumber: pr?.number ?? undefined }
  }
  if (typeof maybePrNumber === 'string' && maybePrNumber.startsWith('#')) {
    return { prNumber: +maybePrNumber.replace('#', '') }
  }
  if (typeof maybePrNumber === 'number') {
    return { prNumber: maybePrNumber }
  }

  throw new Error(`Invalid PR number: ${maybePrNumber}`)
}

export function shouldShowHelp() {
  return argv.help || argv.h
}

async function getPrPlaceholderByNumber(prNumber: number) {
  const { data, errors } = await fetchFromGitHub({
    query: getPrByNumberQuery,
    variables: { prNumber },
  })

  if (errors) {
    throw new Error(`Failed to fetch PR #${prNumber}: ${errors[0].message}`)
  }

  const pr = data.repository.pullRequest
  return getPlaceholderForPr(pr)
}

function getDefaultPlaceholder() {
  return fs.readFile(path.join(DIRNAME, 'placeholder.md'))
}

async function fetchFromGitHub({
  query,
  variables,
}: {
  query: string
  variables: Record<string, any>
}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getGitHubToken()}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  return res.json()
}

type PR = {
  id: string
  title: string
  number: number
  author: {
    login: string
  }
  body: string
}

const pullRequestFragment = `\
fragment PullRequestDetails on PullRequest {
  id
  title
  number
  author {
    login
  }
  body
}
`

const getPrByNumberQuery = `\
${pullRequestFragment}
query ($prNumber: Int!) {
  repository(owner: "redwoodjs", name: "redwood") {
    pullRequest(number: $prNumber) {
      ...PullRequestDetails
    }
  }
}
`

function getPlaceholderForPr(pr: PR) {
  return [
    "(Delete this help paragraph when you're done.) Thanks for writing a changeset! Here's a place to start.",
    "Don't edit the title, but in editing the body, try to explain what this PR means for Redwood users.",
    'The more detail the better. E.g., is it a new feature? How do they use it? Code examples go a long way!',
    '',
    `- ${pr.title} (#${pr.number}) by @${pr.author.login}`,
    '',
    pr.body,
  ].join('\n')
}

async function getStdout(cmd: ProcessPromise) {
  const res = await cmd
  if (res.exitCode !== 0) {
    throw new Error(`Command failed (${res.exitCode}): ${res.stderr}`)
  }

  return res.stdout.trim()
}

function getGitHubToken() {
  const token = process.env.GITHUB_TOKEN || process.env.REDWOOD_GITHUB_TOKEN

  if (!token) {
    throw new Error(
      '\nNo GitHub token found. Please set GITHUB_TOKEN or ' +
        'REDWOOD_GITHUB_TOKEN',
    )
  }

  return token
}
