/* eslint-env node, es2021 */
import octokit from './octokit.mjs'

/**
 * @param {string} milestone
 */
export default async function updateNextReleasePullRequestsMilestone(
  milestone
) {
  const {
    data: { node_id: nextVersionId, number: nextVersionNumber },
  } = await createMilestone(milestone)

  const pullRequestIds = await getPullRequestIdsWithNextReleaseMilestone()

  await Promise.all(
    pullRequestIds.map((pullRequestId) =>
      updatePullRequestMilestone(pullRequestId, nextVersionId)
    )
  )

  // Close the milestone we just created.
  return closeMilestone(nextVersionNumber)
}

// Helpers

/**
 * @param {string} milestone
 * @returns {Promise<{ data: { node_id: string, number: number } }>}
 */
function createMilestone(milestone) {
  // GitHub doesn't have a GraphQL API for creating milestones, so REST it is.
  return octokit.request('POST /repos/{owner}/{repo}/milestones', {
    owner: 'redwoodjs',
    repo: 'redwood',
    title: milestone,
  })
}

/**
 * @typedef {{
 *   repository: {
 *     milestones: {
 *       nodes: Array<{ title: string, id: string }>
 *     }
 *   }
 * }} GetMilestoneIdsRes
 *
 * @typedef {{
 *   node: {
 *     pullRequests: {
 *       nodes: Array<{ id: string }>
 *     }
 *   }
 * }} GetNextReleasePullRequestsRes
 */
export async function getPullRequestIdsWithNextReleaseMilestone() {
  // Get the next-release milestone's id.
  const {
    repository: {
      milestones: { nodes: milestones },
    },
  } = /** @type {GetMilestoneIdsRes} */ (
    await octokit.graphql(GET_MILESTONE_IDS)
  )

  const { id } = milestones.find(
    (milestone) => milestone.title === 'next-release'
  )

  // Get all the PRs with the next-release milestone.
  // Not handling if we merge more than 100 PRs...
  const {
    node: {
      pullRequests: { nodes: pullRequests },
    },
  } = /** @type {GetNextReleasePullRequestsRes} */ (
    await octokit.graphql(GET_NEXT_RELEASE_PULL_REQUEST_IDS, {
      milestoneId: id,
    })
  )

  return pullRequests.map((pullRequest) => pullRequest.id)
}

export const GET_MILESTONE_IDS = `
query GetMilestoneIds {
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

export const GET_NEXT_RELEASE_PULL_REQUEST_IDS = `
  query GetNextReleasePullRequests($milestoneId: ID!) {
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
 * @param {number} number
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
