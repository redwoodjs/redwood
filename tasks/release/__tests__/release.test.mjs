/* eslint-env jest, es2021 */
import {
  MERGED_PRS_NO_MILESTONE,
  MERGED_PRS_NEXT_RELEASE_PATCH_MILESTONE,
} from '../release.mjs'

describe('release', () => {
  it('uses the right queries', () => {
    expect(MERGED_PRS_NO_MILESTONE).toMatchInlineSnapshot(`
      "
        {
          search(query: \\"repo:redwoodjs/redwood is:pr is:merged no:milestone\\", first: 5, type: ISSUE) {
            nodes {
              ... on PullRequest {
                id
              }
            }
          }
        }
      "
    `)

    expect(MERGED_PRS_NEXT_RELEASE_PATCH_MILESTONE).toMatchInlineSnapshot(`
      "
        {
          search(query: \\"repo:redwoodjs/redwood is:pr is:merged milestone:next-release-patch\\", first: 5, type: ISSUE) {
            nodes {
              ... on PullRequest {
                id
              }
            }
          }
        }
      "
    `)
  })
})
