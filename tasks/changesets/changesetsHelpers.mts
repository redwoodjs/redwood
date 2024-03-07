import { fileURLToPath } from 'node:url'

import { humanId } from 'human-id'
import { argv, path, fs } from 'zx'

const ROOT_DIR_PATH = fileURLToPath(new URL('../../', import.meta.url))
const DIRNAME = path.dirname(fileURLToPath(new URL(import.meta.url)))
const CHANGESETS_DIR = path.join(ROOT_DIR_PATH, '.changesets')

export function showHelp() {
  console.log(`\
Usage: yarn changesets [prRef]

  prRef: A PR number or URL. If provided, the changeset will use the PR's title and body as its placeholder.

  Examples:
    yarn changesets                                                  # Create a changeset with the default placeholder
    yarn changesets 10075                                            # Create a changeset with PR 10075's title and body
    yarn changesets https://github.com/redwoodjs/redwood/pull/10075  # Create a changeset with PR 10075's title and body
`)
}

export function getChangesetFilePath() {
  const changesetId = humanId({
    separator: '-',
    capitalize: false,
  })
  return path.join(CHANGESETS_DIR, `${changesetId}.md`)
}

export async function getPlaceholder() {
  const maybePrRef = argv._[0] ?? ''
  const { refType, prRef } = resolvePrRef(maybePrRef)

  switch (refType) {
    case 'url':
      return getPrPlaceholderByUrl(prRef as string)
    case 'number':
      return getPrPlaceholderByNumber(prRef as number)
    default:
      return getDefaultPlaceholder()
  }
}

function resolvePrRef(prRef: string | number) {
  if (prRef === '') {
    return { refType: null }
  }

  if (isNumber(prRef)) {
    return {
      refType: 'number',
      prRef,
    }
  }
  if (typeof prRef === 'string' && prRef.startsWith('#')) {
    return {
      refType: 'number',
      prRef: +prRef.slice(1),
    }
  }

  if (typeof prRef === 'string' && prRef?.startsWith('http')) {
    return {
      refType: 'url',
      prRef,
    }
  }

  throw new Error(`Couldn't resolve reference type for PR reference: ${prRef}`)
}

function isNumber(prRef: string | number) {
  return typeof prRef === 'number' || Number.isInteger(+prRef)
}

async function getPrPlaceholderByUrl(prUrl: string) {
  const { data, errors } = await fetchFromGitHub({
    query: getPrByUrlQuery,
    variables: { prUrl },
  })

  if (errors) {
    throw new Error(`Failed to fetch PR from URL: ${errors[0].message}`)
  }
  if (!data.resource) {
    throw new Error(`No resource found at URL ${prUrl}`)
  }

  const pr = data.resource
  return getPlaceholderForPr(pr)
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

async function fetchFromGitHub({ query, variables }: { query: string; variables: Record<string, any> }) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  if (process.env.REDWOOD_GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.REDWOOD_GITHUB_TOKEN}`
  }

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers,
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

const getPrByUrlQuery = `\
${pullRequestFragment}
query ($prUrl: URI!) {
  resource(url: $prUrl) {
    ... on PullRequest {
      ...PullRequestDetails
    }
  }
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
    "Here's a place to start.",
    "Don't edit the title, but in editing the body, try to explain what this PR means for Redwood users.",
    "The more detail the better. E.g., is it a new feature? How do they use it? Code examples go a long way!",
    '',
    `- ${pr.title} (#${pr.number}) by @${pr.author.login}`,
    '',
    `  ${pr.body}`,
  ].join('\n')
}
