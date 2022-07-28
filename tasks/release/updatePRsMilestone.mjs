/* eslint-env node, es2021 */

import { $ } from 'zx'

import octokit from './octokit.mjs'
import { confirm, confirmRuns, ask, check, ok } from './prompts.mjs'

/**
 * @param {'next-release' | 'next-release-patch'} fromTitle
 * @param {string} toTitle
 */
export default async function updatePRsMilestone(fromTitle, toTitle) {
  let milestone = await getMilestone(toTitle)

  if (!milestone) {
    const createRes = await confirmRuns(
      ask`Milestone ${toTitle} doesn't exist. Ok to create it?`,
      async () => {
        const {
          data: { node_id: id, number },
        } = await createMilestone(toTitle)

        return { id, number }
      }
    )
    if (!createRes) {
      return
    }

    milestone = { title: toTitle, id: createRes.id, number: createRes.number }
  }

  const { id: fromMilestoneId } = await getMilestone(fromTitle)

  const pullRequestIds = await getPullRequestIdsWithMilestone(fromMilestoneId)

  if (!pullRequestIds.length) {
    console.log(ok`No pull requests with milestone ${fromTitle}`)
    return
  }

  const updateRes = await confirmRuns(
    ask`Ok to update the milestone of ${pullRequestIds.length} PRs from ${fromTitle} to ${toTitle}?`,
    async () => {
      try {
        await Promise.all(
          pullRequestIds.map(async (pullRequestId) => {
            await updatePullRequestMilestone(pullRequestId, milestone.id)
            process.stdout.write(`Updated ${pullRequestId}\n`)
          })
        )
      } catch (e) {
        console.log([
          "Something went wrong; we're most likely being rate limited",
          'Try again later by running',
          '',
          `  yarn release prs --from ${fromTitle} --to ${toTitle}`,
          '',
        ])
        console.error(e)
      }
    },
    () =>
      $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+is%3Amerged+milestone%3A${toTitle}
      `
  )
  if (!updateRes) {
    return
  }

  await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+milestone%3A${toTitle}`
  const looksOk = await confirm(
    check`Updated the milestone of ${pullRequestIds.length} PRs. Everything look ok?`
  )
  if (looksOk) {
    return milestone
  }

  await confirmRuns(ask`Ok to undo the changes to the PRs?`, async () => {
    try {
      await Promise.all(
        pullRequestIds.map(async (pullRequestId) => {
          await updatePullRequestMilestone(pullRequestId, fromMilestoneId)
          process.stdout.write(`Updated ${pullRequestId}\n`)
        })
      )
    } catch (e) {
      console.log([
        "Something went wrong; we're most likely being rate limited",
        'Try again later by running',
        '',
        `  yarn release prs --from ${fromTitle} --to ${toTitle}`,
        '',
      ])
      console.error(e)
    }
  })

  await confirmRuns(ask`Ok to delete the ${milestone.title} milestone`, () =>
    deleteMilestone(milestone.number)
  )

  return
}

/**
 * @typedef {{
 *   repository: {
 *     milestones: {
 *       nodes: Array<{ title: string, id: string, number: number }>
 *     }
 *   }
 * }} GetMilestonesRes
 *
 * @param {string} [title]
 */
async function getMilestone(title) {
  const {
    repository: {
      milestones: { nodes: milestones },
    },
  } = /** @type GetMilestonesRes */ (
    await octokit.graphql(GET_MILESTONES, { title })
  )

  let milestone = milestones.find((milestone) => milestone.title === title)

  return milestone
}

export const GET_MILESTONES = `
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
          number
        }
      }
    }
  }
`

/**
 * @param {string} title
 * @returns {Promise<{ data: { node_id: string, number: number } }>}
 */
function createMilestone(title) {
  // GitHub doesn't have a GraphQL API for creating milestones, so REST it is.
  return octokit.request('POST /repos/{owner}/{repo}/milestones', {
    owner: 'redwoodjs',
    repo: 'redwood',
    title,
  })
}

/**
 * @typedef {{
 *   node: {
 *     pullRequests: {
 *       nodes: Array<{ id: string }>
 *     }
 *   }
 * }} GetPullRequestIdsRes
 *
 * @param {string} milestoneId
 */
export async function getPullRequestIdsWithMilestone(milestoneId) {
  const {
    node: {
      pullRequests: { nodes: pullRequests },
    },
  } = /** @type {GetPullRequestIdsRes} */ (
    await octokit.graphql(GET_PULL_REQUEST_IDS, {
      milestoneId,
    })
  )

  return pullRequests.map((pullRequest) => pullRequest.id)
}

export const GET_PULL_REQUEST_IDS = `
  query GetPullRequestIds($milestoneId: ID!) {
    node(id: $milestoneId) {
      ... on Milestone {
        pullRequests(first: 100) {
          nodes {
            id
          }
        }
      }
    }
  }
`

/**
 * @param {string} pullRequestId
 * @param {string} milestoneId
 */
function updatePullRequestMilestone(pullRequestId, milestoneId) {
  return octokit.graphql(UPDATE_PULL_REQUEST_MILESTONE, {
    pullRequestId,
    milestoneId,
  })
}

export const UPDATE_PULL_REQUEST_MILESTONE = `
  mutation UpdatePullRequestMilestone($pullRequestId: ID!, $milestoneId: ID!) {
    updatePullRequest(
      input: { pullRequestId: $pullRequestId, milestoneId: $milestoneId }
    ) {
      clientMutationId
    }
  }
`

/**
 * @param {number} milestone_number
 */
// eslint-disable-next-line camelcase
export function closeMilestone(milestone_number) {
  return octokit.request(
    'POST /repos/{owner}/{repo}/milestones/{milestone_number}',
    {
      owner: 'redwoodjs',
      repo: 'redwood',
      // eslint-disable-next-line camelcase
      milestone_number,
      state: 'closed',
      due_on: new Date().toISOString(),
    }
  )
}

/**
 * @param {number} milestone_number
 */
// eslint-disable-next-line camelcase
function deleteMilestone(milestone_number) {
  return octokit.request(
    'DELETE /repos/{owner}/{repo}/milestones/{milestone_number}',
    {
      owner: 'redwoodjs',
      repo: 'redwood',
      // eslint-disable-next-line camelcase
      milestone_number,
    }
  )
}
