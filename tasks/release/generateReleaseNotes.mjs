/* eslint-env node, es2021 */
import template from 'lodash.template'
import fs from 'node:fs'
import url from 'node:url'

import octokit from './octokit.mjs'

/**
 * Generates release notes for a milestone.
 *
 * @remarks
 *
 * If no milestone's given, just fetch the latest version milestone (e.g. `v0.42.0`).
 *
 * @param {string} [milestone]
 */
export default async function generateReleaseNotes(milestone) {
  // Get the milestone's title, id, and PRs.
  const { title, id } = await getMilestoneId(milestone)
  const prs = await getPRsWithMilestone({ milestoneId: id })

  const filename = new URL(`${title}ReleaseNotes.md`, import.meta.url)
  const filedata = interpolate({
    uniqueContributors: getNoOfUniqueContributors(prs),
    prsMerged: prs.filter((pr) => pr.author.login !== 'renovate').length,
    ...sortPRs(prs),
  })
  fs.writeFileSync(filename, filedata)
  console.log(`Written to ${url.fileURLToPath(filename)}`)
}

// Helpers

/**
 * @typedef {{
 *   repository: {
 *     milestones: {
 *       nodes: Array<{ title: string, id: string }>
 *     }
 *   }
 * }} GetMilestoneIdsRes
 *
 * @param {string} [title]
 */
async function getMilestoneId(title) {
  const {
    repository: {
      milestones: { nodes: milestones },
    },
  } = /** @type GetMilestoneIdsRes */ (
    await octokit.graphql(GET_MILESTONE_IDS, { title })
  )

  if (!title) {
    const [latestMilestone] = milestones
    console.log(
      `No milestone was provided; using the latest: ${latestMilestone.title}`
    )
    return latestMilestone
  }

  let milestone = milestones.find((milestone) => milestone.title === title)

  return milestone
}

export const GET_MILESTONE_IDS = `
  query GetMilestoneIds($title: String) {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(
        query: $title
        first: 3
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
 * @typedef {{
 *   number: number
 *   title: string
 *   author: {
 *     login: string
 *   };
 *   labels: {
 *     nodes: Array<{
 *       name: string
 *     }>
 *   }
 * }} PR
 *
 * @typedef {{
 *   node: {
 *     pullRequests: {
 *       pageInfo: {
 *         hasNextPage: boolean
 *         endCursor: string
 *       }
 *       nodes: Array<PR>
 *       totalCount: number
 *     }
 *   }
 * }} GetPRsWithMilestoneRes
 *
 * @param {{ milestoneId: string, after?: string }}
 * @returns {Promise<Array<PR>>}
 */
async function getPRsWithMilestone({ milestoneId, after }) {
  const {
    node: { pullRequests },
  } = /** @type GetPRsWithMilestoneRes */ (
    await octokit.graphql(GET_PRS_WITH_MILESTONE, {
      milestoneId,
      after,
    })
  )

  if (!pullRequests.pageInfo.hasNextPage) {
    return pullRequests.nodes
  }

  const prs = await getPRsWithMilestone({
    milestoneId,
    after: pullRequests.pageInfo.endCursor,
  })

  return [...pullRequests.nodes, ...prs]
}

export const GET_PRS_WITH_MILESTONE = `
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
            labels(first: 10) {
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
 * Get the number of unique contributors, excluding renovate bot.
 *
 * @param {Array<PR>} prs
 */
function getNoOfUniqueContributors(prs) {
  const logins = prs
    .map((pr) => pr.author.login)
    .filter((login) => login !== 'renovate')

  return new Set(logins).size
}

/**
 * @remarks
 *
 * This could be a little better.
 *
 * @param {Array<PR>} prs
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
      features.push(`- ${formatPR(pr)}`)
      continue
    }

    if (labels.includes('release:fix')) {
      fixed.push(`- ${formatPR(pr)}`)
      continue
    }

    if (labels.includes('release:chore')) {
      chore.push(`- ${formatPR(pr)}`)
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

/**
 * @param {Array<PR>} pr
 */
function formatPR(pr) {
  return `${pr.title} #${pr.number} by @${pr.author.login}`
}

/**
 * Interpolate the template and write to `${cwd}/${milestone}-releaseNotes.md`.
 *
 * @see {@link https://nodejs.org/docs/latest-v15.x/api/esm.html#esm_no_filename_or_dirname}
 */
const interpolate = template(
  [
    '# Changelog',
    '',
    'Unique contributors: ${uniqueContributors}',
    '',
    'PRs merged: ${prsMerged}',
    '',
    '## Features',
    '',
    '${features}',
    '',
    '## Fixed',
    '',
    '${fixed}',
    '',
    '## Chore',
    '',
    '${chore}',
    '',
    '### Package Dependencies',
    '',
    '<details>',
    '<summary>View all Dependency Version Upgrades</summary>',
    '<ul>',
    '${packageDependencies}',
    '</ul>',
    '</details>',
    '',
    '## Manual',
    '',
    '${manual}',
  ].join('\n')
)
