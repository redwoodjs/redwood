#!/usr/bin/env node
/* eslint-env node, es6*/

import template from 'lodash.template'
import fs from 'node:fs'
import url from 'node:url'
import { Octokit } from 'octokit'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

/**
 * If the user didn't provide a GitHub token, exit early.
 */
if (!process.env.GITHUB_TOKEN) {
  console.log()
  console.error(
    `  You have to provide a GitHub personal-access token (PAT) by setting it to an env var named "GITHUB_TOKEN"`
  )
  console.error(
    `  You can provision a PAT here: https://github.com/settings/tokens`
  )
  console.log()

  /**
   * There's a few ways we could exit,
   * but `process.exit` actually isn't recommended: {@link https://nodejs.dev/learn/how-to-exit-from-a-nodejs-program}.
   */
  process.kill(process.pid)
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

/**
 * Yargs bindings.
 *
 * @param {typeof yargs} yargs
 */
function builder(yargs) {
  yargs
    .positional('milestone', {
      describe: 'The milestone to generate release notes for',
      type: 'string',
    })
    .example('$0 v0.40.0', 'Build release notes for v0.40.0')
}

const GET_MILESTONE_IDS = `
  query GetMilestoneIds($title: String) {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(
        query: $title
        first: 100
        orderBy: { field: NUMBER, direction: DESC }
      ) {
        nodes {
          title
          id
        }
      }
    }
  }
`

/**
 * @param {string} title
 */
async function getMilestoneId(title) {
  const {
    repository: { milestones },
  } = await octokit.graphql(GET_MILESTONE_IDS, { title })

  let milestone = milestones.nodes.find(
    (milestone) => milestone.title === title
  )

  if (!milestone) {
    const [latestMilestone] = milestones.nodes
    console.log(
      `No milestone was provided; using the latest: ${latestMilestone.title}`
    )
    milestone = latestMilestone
  }

  return milestone
}

const GET_PRS_WITH_MILESTONE = `
  query GetPRsWithMilestone($milestoneId: ID!, $after: String) {
    node(id: $milestoneId) {
      ... on Milestone {
        pullRequests(first: 100, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            number
            title
            author {
              login
            }
            labels(first: 100) {
              nodes {
                name
              }
            }
          }
          totalCount
        }
      }
    }
  }
`

/**
 * @param {{ milestoneId: string, after?: string }}
 */
async function getPRsWithMilestone({ milestoneId, after }) {
  const {
    node: { pullRequests },
  } = await octokit.graphql(GET_PRS_WITH_MILESTONE, {
    milestoneId,
    after,
  })

  if (!pullRequests.pageInfo.hasNextPage) {
    return pullRequests.nodes
  }

  const prs = await getPRsWithMilestone({
    milestoneId,
    after: pullRequests.pageInfo.endCursor,
  })

  return [...pullRequests.nodes, ...prs]
}

/**
 * This function does pretty much all the work.
 *
 * @param {{
 *   milestone: string,
 * }} argv
 */
async function handler(argv) {
  /**
   * Get the milestone's title, id, and PRs.
   */
  const { title, id } = await getMilestoneId(argv.milestone)
  const prs = await getPRsWithMilestone({ milestoneId: id })

  const filename = new URL(`${title}-release-notes.md`, import.meta.url)
  const filedata = interpolate({
    uniqueContributors: getNoOfUniqueContributors(prs),
    prsMerged: prs.filter((pr) => pr.author.login !== 'renovate').length,
    ...sortPRs(prs),
  })
  fs.writeFileSync(filename, filedata)

  console.log(`Written to ${url.fileURLToPath(filename)}`)
  console.log('Done')
}

yargs(hideBin(process.argv))
  .scriptName('release-notes')
  .usage(
    '$0 [milestone]',
    'Build release notes for a milestone',
    builder,
    handler
  )
  .help()
  .parse()

/**
 * Helper functions.
 */

/**
 * Interpolate the template and write to `${cwd}/${milestone}-release-notes.md`.
 *
 * @see {@link https://nodejs.org/docs/latest-v15.x/api/esm.html#esm_no_filename_or_dirname}
 */
const interpolate = template(
  fs.readFileSync(new URL('release-notes.md.template', import.meta.url), 'utf8')
)

/**
 * A helper function for formatting PRs.
 * A `pr` looks like:
 *
 * ```js
 * {
 *   "number": 2613,
 *   "title": "Scaffold Generator File Organization",
 *   "author": {
 *     "login": "cjreimer",
 *     },
 *   }
 * ```
 *
 * @param {{
 *   number: number,
 *   title: string,
 *   author: {
 *     login: string,
 *   }
 * }} pr
 */
function formatPR(pr) {
  return `${pr.title} #${pr.number} by @${pr.author.login}`
}

function getNoOfUniqueContributors(prs) {
  const logins = prs
    .map((pr) => pr.author.login)
    .filter((login) => login !== 'renovate')

  return new Set(logins).size
}

/**
 * @param {Array<{
 *   number: number,
 *   title: string,
 *   author: { login: string }
 *   labels: { nodes: Array<{ name: string }> }
 * }>} prs
 */
function sortPRs(prs) {
  const features = []
  const fixed = []
  const chore = []
  const packageDependencies = []
  const manual = []

  for (const pr of prs) {
    /**
     * Sort `packageDependencies` by author (i.e. renovate bot).
     */
    if (pr.author.login === 'renovate') {
      packageDependencies.push(`<li>${formatPR(pr)}</li>`)
      continue
    }

    /**
     * Sort the rest by label.
     */
    const labels = pr.labels.nodes.map((label) => label.name)

    if (labels.includes('release:feature')) {
      features.push(`<li>${formatPR(pr)}</li>`)
      continue
    }

    if (labels.includes('release:fix')) {
      fixed.push(`<li>${formatPR(pr)}</li>`)
      continue
    }

    if (labels.includes('release:chore')) {
      chore.push(`<li>${formatPR(pr)}</li>`)
      continue
    }

    /**
     * Those that can't be sorted.
     */
    manual.push(`- ${formatPR(pr)}`)
  }

  return {
    features: features.join('\n'),
    fixed: fixed.join('\n'),
    chore: chore.join('\n'),
    packageDependencies: packageDependencies.join('\n'),
    manual: manual.join('\n'),
  }
}
