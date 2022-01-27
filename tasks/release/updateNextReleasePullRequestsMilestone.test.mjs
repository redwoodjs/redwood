/* eslint-env jest, es2021 */
import { rest, graphql } from 'msw'
import { setupServer } from 'msw/node'

import updateNextReleasePullRequestsMilestone, {
  GET_MILESTONE_IDS,
  GET_NEXT_RELEASE_PULL_REQUEST_IDS,
  UPDATE_NEXT_RELEASE_PULL_REQUEST_MILESTONE,
} from './updateNextReleasePullRequestsMilestone.mjs'

/**
 * MSW setup
 */
let nextVersionMilestone

const handleCreateMilestone = rest.post(
  'https://api.github.com/repos/:owner/:repo/milestones',
  (req, res, ctx) => {
    const { title } = req.body

    if (!title) {
      return res(ctx.status(422))
    }

    const { owner, repo } = req.params

    if (owner !== 'redwoodjs' || repo !== 'redwood') {
      return res(ctx.status(404))
    }

    nextVersionMilestone = {
      node_id: `123-${title}`,
      number: 1,
    }

    return res(ctx.json(nextVersionMilestone))
  }
)

const nextReleaseMilestone = {
  title: 'next-release',
  id: 'MI_kwDOC2M2f84Aa82f',
}

const handleGetMilestoneIds = graphql.query(
  'GetMilestoneIds',
  (_req, res, ctx) => {
    return res(
      ctx.data({
        repository: {
          milestones: {
            nodes: [
              {
                title: 'next-release-patch',
                id: 'MDk6TWlsZXN0b25lNjc1Nzk0MQ==',
              },
              {
                title: 'next-release-priority',
                id: 'MDk6TWlsZXN0b25lNjc3MTI3MQ==',
              },
              nextReleaseMilestone,
            ],
          },
        },
      })
    )
  }
)

const pullRequests = [
  {
    id: 'PR_kwDOC2M2f84svWtA',
  },
  {
    id: 'PR_kwDOC2M2f84xGIzx',
  },
  {
    id: 'PR_kwDOC2M2f84xHG6Y',
  },
]

const handleGetNextReleasePullRequestIds = graphql.query(
  'GetNextReleasePullRequestIds',
  (req, res, ctx) => {
    const { milestoneId } = req.variables

    if (milestoneId !== nextReleaseMilestone.id) {
      return res(
        ctx.data({
          node: null,
        })
      )
    }

    return res(
      ctx.data({
        node: {
          pullRequests: {
            nodes: pullRequests,
          },
        },
      })
    )
  }
)

const handleUpdatePullRequestMilestone = graphql.mutation(
  'UpdatePullRequestMilestone',
  (req, res, ctx) => {
    const { pullRequestId, milestoneId } = req.variables

    if (
      milestoneId !== nextVersionMilestone.node_id ||
      !pullRequests.map((pullRequest) => pullRequest.id).includes(pullRequestId)
    ) {
      return res(
        ctx.data({
          updatePullRequest: null,
        })
      )
    }

    return res(
      ctx.data({
        updatePullRequest: {
          clientMutationId: '123',
        },
      })
    )
  }
)

const handleCloseMilestone = rest.post(
  'https://api.github.com/repos/:owner/:repo/milestones/:milestone_number',
  (req, res, ctx) => {
    const { milestone_number } = req.params

    if (+milestone_number !== nextVersionMilestone.number) {
      return res(ctx.status(404))
    }

    const { state } = req.body

    return res(
      ctx.json({
        state,
      })
    )
  }
)

const server = setupServer(
  handleCreateMilestone,
  handleGetMilestoneIds,
  handleGetNextReleasePullRequestIds,
  handleUpdatePullRequestMilestone,
  handleCloseMilestone
)

beforeAll(() => server.listen())

afterAll(() => server.close())

describe('updateNextReleasePullRequestsMilestone', () => {
  it('works', async () => {
    await updateNextReleasePullRequestsMilestone('v0.42.1')
  })

  it.only('uses the right queries', () => {
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
