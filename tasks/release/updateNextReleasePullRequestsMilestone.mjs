/* eslint-env node, es2021 */
import c from 'ansi-colors'

import octokit from './octokit.mjs'
import { confirm } from './release.mjs'

/**
 * @param {string} title
 */
export default async function updateNextReleasePullRequestsMilestone(title) {
  let milestone = await getMilestone(title)

  if (!milestone) {
    const okToCreate = await confirm(
      `Milestone ${c.green(title)} doesn't exist. Ok to create it?`
    )

    if (!okToCreate) {
      return
    }

    const {
      data: { node_id: id, number },
    } = await createMilestone(title)

    milestone = { id, number }

    console.log(`Created milestone ${c.green(title)}`)
  }

  const nextReleaseMilestoneId = await getNextReleaseMilestoneId()

  const pullRequestIds = await getPullRequestIdsWithMilestone(
    nextReleaseMilestoneId
  )

  const okToUpdate = await confirm(
    `Ok to update the milestone of ${pullRequestIds.length} PRs from ${c.green(
      'next-release'
    )} to ${c.green(title)}?`
  )

  if (!okToUpdate) {
    return
  }

  await Promise.all(
    pullRequestIds.map((pullRequestId) =>
      updatePullRequestMilestone(pullRequestId, milestone.id)
    )
  )

  const looksRight = await confirm(
    `${c.bgYellow(c.black(' CHECK '))} Updated the milestone of ${
      pullRequestIds.length
    } PRs: https://github.com/redwoodjs/redwood/milestone/${
      milestone.number
    }\n  Does everything look right?`
  )

  if (!looksRight) {
    const undo = await confirm(`Do you want to undo the changes to the PRs?`)

    if (!undo) {
      return
    }

    await Promise.all(
      pullRequestIds.map((pullRequestId) =>
        updatePullRequestMilestone(pullRequestId, nextReleaseMilestoneId)
      )
    )

    console.log('Changes to the PRs undone')

    return
  }

  const okToClose = await confirm(`Ok to close milestone ${c.green(title)}?`)

  if (okToClose) {
    closeMilestone(milestone.number)
  }

  console.log('Done')
}

// Helpers

/**
 * @typedef {{
 *   repository: {
 *     milestones: {
 *       nodes: Array<{ title: string, id: string }>
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
 *   repository: {
 *     milestones: {
 *       nodes: Array<{ title: string, id: string }>
 *     }
 *   }
 * }} GetNextReleaseMilestoneIdRes
 */
async function getNextReleaseMilestoneId() {
  const {
    repository: {
      milestones: { nodes: milestones },
    },
  } = /** @type {GetNextReleaseMilestoneIdRes} */ (
    await octokit.graphql(GET_NEXT_RELEASE_MILESTONE_ID)
  )

  const { id } = milestones.find(
    (milestone) => milestone.title === 'next-release'
  )

  return id
}

export const GET_NEXT_RELEASE_MILESTONE_ID = `
  query GetNextReleaseMilestoneId {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(query: "next-release", first: 5) {
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
 *   node: {
 *     pullRequests: {
 *       nodes: Array<{ id: string }>
 *     }
 *   }
 * }} GetNextReleasePullRequestIdsRes
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
  } = /** @type {GetNextReleasePullRequestIdsRes} */ (
    await octokit.graphql(GET_NEXT_RELEASE_PULL_REQUEST_IDS, {
      milestoneId,
    })
  )

  return pullRequests.map((pullRequest) => pullRequest.id)
}

export const GET_NEXT_RELEASE_PULL_REQUEST_IDS = `
  query GetNextReleasePullRequestIds($milestoneId: ID!) {
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
  return octokit.graphql(UPDATE_NEXT_RELEASE_PULL_REQUEST_MILESTONE, {
    pullRequestId,
    milestoneId,
  })
}

export const UPDATE_NEXT_RELEASE_PULL_REQUEST_MILESTONE = `
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
function closeMilestone(milestone_number) {
  return octokit.request(
    'POST /repos/{owner}/{repo}/milestones/{milestone_number}',
    {
      owner: 'redwoodjs',
      repo: 'redwood',
      milestone_number,
      state: 'closed',
    }
  )
}
