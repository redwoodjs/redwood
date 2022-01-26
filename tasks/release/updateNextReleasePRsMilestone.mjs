/* eslint-env node, es2021 */
import octokit from './octokit.mjs'

/**
 * @param {string} milestone
 */
export default async function updateNextReleasePRsMilestone(milestone) {
  const {
    data: { node_id: nextVersionId, number: nextVersionNumber },
  } = await createMilestone(milestone)

  const pullRequests = await getPullRequestsWithNextReleaseMilestone()

  await Promise.all(
    pullRequests.map((pullRequest) =>
      updatePullRequestMilestone(pullRequest.id, nextVersionId)
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

async function getPullRequestsWithNextReleaseMilestone() {
  // Get the next-release milestone's id.
  const {
    repository: { milestones },
  } = await octokit.graphql(`
    {
      repository(owner: "redwoodjs", name: "redwood") {
        milestones(query: "next-release", first: 5) {
          nodes {
            title
            id
          }
        }
      }
    }
  `)

  const { id } = milestones.nodes.find(
    (milestone) => milestone.title === 'next-release'
  )

  // Get all the PRs with the next-release milestone.
  // If we merge more than 100 PRs...
  const {
    node: {
      pullRequests: { nodes },
    },
  } = await octokit.graphql(
    `
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
    `,
    {
      milestoneId: id,
    }
  )

  return nodes
}

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

/**
 * @param {string} pullRequestId
 * @param {string} milestoneId
 */
function updatePullRequestMilestone(pullRequestId, milestoneId) {
  return octokit.graphql(
    `
      mutation UpdatePullRequestMilestone($pullRequestId: ID!, $milestoneId: ID!) {
        updatePullRequest(
          input: { pullRequestId: $pullRequestId, milestoneId: $milestoneId }
        ) {
          clientMutationId
        }
      }
    `,
    {
      pullRequestId,
      milestoneId,
    }
  )
}
