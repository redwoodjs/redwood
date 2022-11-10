/* eslint-env node, es2022 */

import { Octokit } from 'octokit'
import { chalk } from 'zx'

import { isCommitInBranch, getReleaseBranch } from './branchStrategyLib.mjs'

export const command = 'validate-milestones'
export const description = 'Validate PRs with the "next-release" milestone'

export async function handler() {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

  const {
    node: {
      pullRequests: { nodes: prs },
    },
  } = await octokit.graphql(getNextReleasePRs)

  const branch = await getReleaseBranch()
  console.log()

  let {
    repository: {
      milestones: { nodes: milestones },
    },
  } = await octokit.graphql(getMilestoneIds)

  milestones = milestones.reduce((obj, { title, id }) => {
    obj[title] = id
    return obj
  }, {})

  for (const pr of prs) {
    if (await isCommitInBranch(branch, pr.mergeCommit.messageHeadline)) {
      console.log(
        [
          `${chalk.red('error')}: pr #${
            pr.number
          } should be milestoned ${chalk.green(branch.split('/')[2])}`,
          `${chalk.blue('fixing')}: milestoning PR #${
            pr.number
          } to ${chalk.green(branch.split('/')[2])}`,
        ].join('\n')
      )

      await octokit.graphql(milestonePullRequest, {
        pullRequestId: pr.id,
        milestoneId: milestones[branch.split('/')[2]],
      })

      console.log(chalk.green('done'))
      console.log()

      continue
    }

    if (await isCommitInBranch('next', pr.mergeCommit.messageHeadline)) {
      console.log(
        `${chalk.green('ok')}: pr #${
          pr.number
        } should be milestoned next release`
      )
      console.log(chalk.green('done'))
      console.log()
      continue
    }

    console.log(
      [
        `${chalk.red('error')}: pr #${
          pr.number
        } should be milestoned ${chalk.green('v4.0.0')}`,
        `${chalk.blue('fixing')}: milestoning PR #${pr.number} to ${chalk.green(
          'v4.0.0'
        )}`,
      ].join('\n')
    )

    await octokit.graphql(milestonePullRequest, {
      pullRequestId: pr.id,
      milestoneId: milestones['v4.0.0'],
    })

    console.log(chalk.green('done'))
    console.log()
  }
}

const getNextReleasePRs = `
  query GetNextReleasePRs {
    node(id: "MI_kwDOC2M2f84Aa82f") {
      ... on Milestone {
        pullRequests(first: 100) {
          nodes {
            id
            number
            title
            mergeCommit {
              messageHeadline
            }
          }
        }
      }
    }
  }
`

const getMilestoneIds = `
  query GetMilestoneIds {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(first: 10, states: OPEN) {
        nodes {
          id
          title
        }
      }
    }
  }
`

const milestonePullRequest = `
  mutation MilestonePullRequest($pullRequestId: ID!, $milestoneId: ID!) {
    updatePullRequest(
      input: { pullRequestId: $pullRequestId, milestoneId: $milestoneId }
    ) {
      clientMutationId
    }
  }
`
