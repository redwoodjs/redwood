/* eslint-env jest, es2021 */
import { rest, graphql } from 'msw'
import { setupServer } from 'msw/node'
import prompts from 'prompts'

import updatePRsMilestone, {
  GET_MILESTONES,
  GET_PULL_REQUEST_IDS,
  UPDATE_PULL_REQUEST_MILESTONE,
} from '../updatePRsMilestone.mjs'

/**
 * MSW setup
 */
const nextReleaseMilestone = {
  title: 'next-release',
  id: 'MI_kwDOC2M2f84Aa82f',
}

const nextReleasePatchMilestone = {
  title: 'next-release-patch',
  id: 'MDk6TWlsZXN0b25lNjc1Nzk0MQ==',
}

const milestonesNodes = [
  nextReleaseMilestone,
  nextReleasePatchMilestone,
  {
    title: 'next-release-priority',
    id: 'MDk6TWlsZXN0b25lNjc3MTI3MQ==',
  },
]

const handleGetMilestones = graphql.query('GetMilestoneIds', (_req, res, ctx) =>
  res(
    ctx.data({
      repository: {
        milestones: {
          nodes: milestonesNodes,
        },
      },
    })
  )
)

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
      title,
      node_id: `123-${title}`,
      number: 1,
    }

    return res(ctx.json(nextVersionMilestone))
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

const handleGetPullRequestIds = graphql.query(
  'GetPullRequestIds',
  (req, res, ctx) => {
    const { milestoneId } = req.variables

    if (
      ![nextReleaseMilestone.id, nextReleasePatchMilestone.id].includes(
        milestoneId
      )
    ) {
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
    // eslint-disable-next-line camelcase
    const { milestone_number } = req.params

    // eslint-disable-next-line camelcase
    if (+milestone_number !== nextVersionMilestone.number) {
      return res(ctx.status(404))
    }

    // eslint-disable-next-line camelcase
    const { state, due_on } = req.body

    return res(
      ctx.json({
        state,
        // eslint-disable-next-line camelcase
        due_on,
      })
    )
  }
)

const server = setupServer(
  handleGetMilestones,
  handleCreateMilestone,
  handleGetPullRequestIds,
  handleUpdatePullRequestMilestone,
  handleCloseMilestone
)

beforeAll(() => server.listen())

afterAll(() => server.close())

describe('updatePRsMilestone', () => {
  it('uses the right queries', () => {
    expect(GET_MILESTONES).toMatchInlineSnapshot(`
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
                number
              }
            }
          }
        }
      "
    `)

    expect(GET_PULL_REQUEST_IDS).toMatchInlineSnapshot(`
      "
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
      "
    `)

    expect(UPDATE_PULL_REQUEST_MILESTONE).toMatchInlineSnapshot(`
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

  it('changes next-release milestones to a version milestone', async () => {
    prompts.inject([
      // createOk
      true,
      // updateOk
      true,
      // looksOk
      true,
    ])

    const milestone = await updatePRsMilestone('next-release', 'v0.42.1')
    const { node_id: id, ...rest } = nextVersionMilestone
    expect(milestone).toEqual({ id, ...rest })
  })

  it('changes next-release-patch milestones to a version milestone', async () => {
    prompts.inject([
      // createOk
      true,
      // updateOk
      true,
      // looksOk
      true,
    ])

    const milestone = await updatePRsMilestone('next-release-patch', 'v0.42.1')
    const { node_id: id, ...rest } = nextVersionMilestone
    expect(milestone).toEqual({ id, ...rest })
  })
})
