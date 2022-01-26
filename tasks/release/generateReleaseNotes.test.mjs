import {
  GET_MILESTONE_IDS,
  GET_PRS_WITH_MILESTONE,
} from './generateReleaseNotes.mjs'

describe('generateReleaseNotes', () => {
  it('uses the right queries', () => {
    expect(GET_MILESTONE_IDS).toMatchInlineSnapshot(`
      "
        query GetMilestoneIds($title: String) {
          repository(owner: \\"redwoodjs\\", name: \\"redwood\\") {
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
      "
    `)

    expect(GET_PRS_WITH_MILESTONE).toMatchInlineSnapshot(`
      "
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
      "
    `)
  })
})
