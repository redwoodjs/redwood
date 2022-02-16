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
    const createOk = await confirm(
      ask`Milestone ${toTitle} doesn't exist. Ok to create it?`
    )
    if (!createOk) {
      return
    }

    const {
      data: { node_id: id, number },
    } = await createMilestone(toTitle)

    milestone = { title: toTitle, id, number }
  }

  const fromMilestoneId = (await getMilestone(fromTitle)).id

  const pullRequestIds = await getPullRequestIdsWithMilestone(fromMilestoneId)

  if (!pullRequestIds.length) {
    console.log(ok`No pull requests with milestone ${fromTitle}`)
    return
  }

  const updateOk = await confirm(
    ask`Ok to update the milestone of ${pullRequestIds.length} PRs from ${fromTitle} to ${toTitle}?`
  )
  if (!updateOk) {
    return
  }

  await Promise.all(
    pullRequestIds.map((pullRequestId) =>
      updatePullRequestMilestone(pullRequestId, milestone.id)
    )
  )

  await $`open https://github.com/redwoodjs/redwood/pulls?q=is%3Apr+milestone%3A${toTitle}`

  const looksOk = await confirm(
    check`Updated the milestone of ${pullRequestIds.length} PRs\nDoes everything look ok?`
  )
  if (looksOk) {
    return milestone
  }

  const undoPRs = await confirm(
    ask`Do you want to undo the changes to the PRs?`
  )
  if (undoPRs) {
    await Promise.all(
      pullRequestIds.map((pullRequestId) =>
        updatePullRequestMilestone(pullRequestId, fromMilestoneId)
      )
    )
  }

  const undoMilestone = await confirm(ask`Do you want to delete the milestone`)
  if (undoMilestone) {
    await deleteMilestone(milestone.number)
  }

  return
}

// Helpers

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
  /**
   * Right now we're not handling the case that we merge more than 100 PRs.
   */
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
