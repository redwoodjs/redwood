/* eslint-disable no-undef */
/* eslint-env node, es6*/

const core = require('@actions/core')
const github = require('@actions/github')

// getMilestoneNodeId
// ------------------------

const QUERY = `
  query RepositoryQuery($milestone: String!) {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(query: $milestone, first: 3) {
        nodes {
          id
          title
        }
      }
    }
  }
`

const getMilestoneNodeId = (octokit) => async (milestone) => {
  const res = await octokit.graphql(QUERY, { milestone })
  return res.repository.milestones.nodes.find(
    (node) => node.title === milestone
  ).id
}

// updatePullRequestMilestone
// ------------------------

const MUTATION = `
  mutation UpdatePullRequestMutation($input: UpdatePullRequestInput!) {
    updatePullRequest(input: $input) {
      clientMutationId
    }
  }
`

const updatePullRequestMilestone =
  (octokit) =>
  ({ pullRequestId, milestoneId }) =>
    octokit.graphql(MUTATION, {
      input: {
        pullRequestId,
        milestoneId,
      },
    })

// run
// ------------------------

const run = async () => {
  const octokit = github.getOctokit(core.getInput('github-token'))
  const milestone = core.getInput('milestone')
  let milestoneId = null

  if (milestone) {
    console.log(`Getting "${milestone}"'s node ID...`)
    milestoneId = await getMilestoneNodeId(octokit)(milestone)
    console.log(`"${milestone}"'s node ID is ${milestoneId}`)
  }

  try {
    const pullRequestId = github.context.payload.pull_request.node_id

    if (milestone) {
      console.log(
        `Updating pull request ${pullRequestId}'s milestone to "${milestone}"...`
      )
    } else {
      console.log(`Removing pull request ${pullRequestId}'s milestone...`)
    }

    await updatePullRequestMilestone(octokit)({ pullRequestId, milestoneId })

    console.log('Done')
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
