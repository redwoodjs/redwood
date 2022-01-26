/* eslint-env node, es2021 */
import octokit from './octokit.mjs'

/**
 * @param {string} milestone
 */
export default async function updateNextReleasePRsMilestone(milestone) {
  // GitHub doesn't have a GraphQL API for creating milestones, so REST it is.
  const {
    data: { node_id: nextVersionId, number: nextVersionNumber },
  } = await octokit.request('POST /repos/{owner}/{repo}/milestones', {
    owner: 'redwoodjs',
    repo: 'redwood',
    title: milestone,
  })

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

  const { id: nextReleaseMilestoneId } = milestones.nodes.find(
    (milestone) => milestone.title === 'next-release'
  )

  // Get all the PRs with the next-release milestone.
  const {
    node: { pullRequests },
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
      milestoneId: nextReleaseMilestoneId,
    }
  )

  // Change all the PRs milestone to nextVersion.
  const pullRequestPromises = pullRequests.nodes.map((pullRequest) =>
    octokit.graphql(
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
        pullRequestId: pullRequest.id,
        milestoneId: nextVersionId,
      }
    )
  )

  await Promise.all(pullRequestPromises)

  // Close the milestone we just created.
  return octokit.request(
    'POST /repos/{owner}/{repo}/milestones/{milestone_number}',
    {
      owner: 'redwoodjs',
      repo: 'redwood',
      milestone_number: nextVersionNumber,
      state: 'closed',
    }
  )
}
