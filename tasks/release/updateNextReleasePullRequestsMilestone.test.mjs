/* eslint-env jest, es2021 */

import {
  GET_MILESTONE_IDS,
  GET_NEXT_RELEASE_PULL_REQUEST_IDS,
  UPDATE_NEXT_RELEASE_PULL_REQUEST_MILESTONE,
} from './updateNextReleasePullRequestsMilestone.mjs'

describe('updateNextReleasePullRequestsMilestone', () => {
  it('uses the right queries', () => {
    expect(GET_MILESTONE_IDS).toMatchInlineSnapshot(`
      "
      query GetMilestoneIds {
        repository(owner: \\"redwoodjs\\", name: \\"redwood\\") {
          milestones(query: \\"next-release\\", first: 5) {
            nodes {
              title
              id
            }
          }
        }
      }
      "
    `)

    expect(GET_NEXT_RELEASE_PULL_REQUEST_IDS).toMatchInlineSnapshot(`
      "
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
      "
    `)

    expect(UPDATE_NEXT_RELEASE_PULL_REQUEST_MILESTONE).toMatchInlineSnapshot(`
      "
        mutation UpdatePullRequestMilestone($pullRequestId: ID!, $milestoneId: ID!) {
          updatePullRequest(
            input: { pullRequestId: $pullRequestId, milestoneId: $milestoneId }
          ) {
            clientMutationId
          }
        }
      "
    `)
  })
})
