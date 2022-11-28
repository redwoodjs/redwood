/* eslint-env node, es2022 */

import { Octokit } from 'octokit'
import { $ } from 'zx'
import { chalk, question } from 'zx'

import { isCommitInBranch, getReleaseBranch } from './branchStrategyLib.mjs'

export const command = 'validate-milestones'
export const description =
  "Validate PRs' milestone (i.e., that a PR milestoned v3.5.0 is in release/minor/v3.5.0)"

export function builder(yargs) {
  yargs.option('prompt', {
    description: 'Prompt for confirmation before fixing',
    type: 'boolean',
    default: false,
  })
}

export async function handler({ prompt }) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

  let {
    repository: {
      milestones: { nodes },
    },
  } = await octokit.graphql(getPRs)

  nodes = nodes.filter((node) => node.title !== 'chore')

  if (
    !nodes.every((milestone) => !milestone.pullRequests.pageInfo.hasNextPage)
  ) {
    console.log('A milestone has a next page; this script needs to be updated')
    process.exit(1)
  }

  const prs = nodes.flatMap((milestone) => {
    return milestone.pullRequests.nodes.map((pr) => {
      pr.mergeCommit.message = pr.mergeCommit.message.split('\n').shift()

      return {
        ...pr,
        milestone: milestone.title,
      }
    })
  })

  const milestoneTitlesToIds = nodes.reduce((obj, { title, id }) => {
    obj[title] = id
    return obj
  }, {})

  async function validateMilestone(pr, milestone) {
    const hasCorrectMilestone = pr.milestone === milestone

    console.log()
    console.log(
      [
        `  #${chalk.yellow(pr.number)} ${chalk.blue(
          pr.title
        )} should be milestoned ${chalk.magenta(milestone)}`,
        `  ${
          hasCorrectMilestone ? chalk.green('ok') : chalk.red('error')
        }: it's currently milestoned ${chalk.magenta(pr.milestone)}`,
      ].join('\n')
    )

    if (hasCorrectMilestone) {
      console.log(`  ${chalk.green('done')}`)
      return
    }

    let answer = 'y'

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (prompt) {
        answer = await question('  ok to fix? [Y/n/o(pen)] > ')
      }

      if (answer === 'o' || answer === 'open') {
        await $`open https://github.com/redwoodjs/redwood/pull/${pr.number}`
        continue
      }

      if (answer === 'y' || answer === 'Y' || answer === '') {
        console.log(
          `  ${chalk.blue('fixing')}: milestoning #${chalk.yellow(
            pr.number
          )} ${chalk.magenta(milestone)}`
        )
        await octokit.graphql(milestonePullRequest, {
          pullRequestId: pr.id,
          milestoneId: milestoneTitlesToIds[milestone],
        })
      }

      console.log(`  ${chalk.green('done')}`)

      break
    }
  }

  const branch = await getReleaseBranch()
  console.log()

  for (const pr of prs) {
    console.log(chalk.dim('-'.repeat(process.stdout.columns)))

    if (await isCommitInBranch(branch, pr.mergeCommit.message)) {
      await validateMilestone(pr, branch.split('/')[2])
      continue
    }

    if (await isCommitInBranch('next', pr.mergeCommit.message)) {
      await validateMilestone(pr, 'next-release')
      continue
    }

    await validateMilestone(pr, 'v4.0.0')
  }
}

const getPRs = `
  query GetPRs {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(first: 10, states: OPEN) {
        nodes {
          id
          title

          pullRequests(first: 100) {
            pageInfo {
              hasNextPage
              endCursor
            }

            totalCount

            nodes {
              id
              number
              title
              mergeCommit {
                message
              }
            }
          }
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
