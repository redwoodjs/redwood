import { graphql } from 'msw'
import { setupServer } from 'msw/node'
import fs from 'node:fs'

import generateReleaseNotes, {
  GET_MILESTONE_IDS,
  GET_PRS_WITH_MILESTONE,
} from '../generateReleaseNotes.mjs'

const handleGetMilestoneIds = graphql.query(
  'GetMilestoneIds',
  (req, res, ctx) => {
    const { title } = req.variables
    return res(
      ctx.data({
        repository: {
          milestones: {
            nodes: [
              title
                ? {
                    title,
                    id: `123-${title}`,
                  }
                : {
                    title: 'v0.42.1',
                    id: 'MI_kwDOC2M2f84Ac_Ij',
                  },
            ],
          },
        },
      })
    )
  }
)

const handleGetPRsWithMilestone = graphql.query(
  'GetPRsWithMilestone',
  (_req, res, ctx) => {
    const payload = {
      node: {
        pullRequests: {
          pageInfo: {
            hasNextPage: false,
            endCursor: 'Y3Vyc29yOnYyOpLAzjEcbpg=',
          },
          nodes: [
            {
              number: 3515,
              title:
                'Add storybook ci option to test that Storybook starts "ok"',
              author: {
                login: 'virtuoushub',
              },
              labels: {
                nodes: [
                  {
                    name: 'topic/storybook',
                  },
                  {
                    name: 'v1/priority',
                  },
                  {
                    name: 'release:chore',
                  },
                ],
              },
            },
            {
              number: 4164,
              title: 'Type fix for `mockGraphQL` data argument',
              author: {
                login: 'callingmedic911',
              },
              labels: {
                nodes: [
                  {
                    name: 'topic/testing',
                  },
                  {
                    name: 'v1/priority',
                  },
                  {
                    name: 'release:fix',
                  },
                ],
              },
            },
            {
              number: 4169,
              title: 'Added Decimal field type to Scaffold',
              author: {
                login: 'BBurnworth',
              },
              labels: {
                nodes: [
                  {
                    name: 'release:feature',
                  },
                ],
              },
            },
          ],
          totalCount: 46,
        },
      },
    }

    return res(ctx.data(payload))
  }
)

const server = setupServer(handleGetMilestoneIds, handleGetPRsWithMilestone)

beforeAll(() => server.listen())

afterAll(() => {
  server.close()
  if (
    fs.existsSync(new URL('../next-releaseReleaseNotes.md', import.meta.url))
  ) {
    fs.rmSync(new URL('../next-releaseReleaseNotes.md', import.meta.url))
  }
})

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

  it('MSW unit test', async () => {
    await generateReleaseNotes('next-release')

    expect(
      fs.readFileSync(
        new URL('../next-releaseReleaseNotes.md', import.meta.url),
        'utf8'
      )
    ).toMatchSnapshot()
  })
})
