/* eslint-env node */

import { Octokit } from 'octokit'
import { chalk, question, $ } from 'zx'

import {
  logSection,
  separator,
  isCommitInRef,
  isYes,
  getReleaseBranch,
  getReleaseCommits,
  sanitizeMessage,
  updateRemotes,
} from './releaseLib.mjs'

export const command = 'validate-milestones'
export const description =
  "Validate PRs' milestone (i.e., that a PR milestoned v3.5.0 is in release/minor/v3.5.0)"

export function builder(yargs) {
  yargs.option('prompt', {
    description: 'Prompt for confirmation before fixing',
    type: 'boolean',
    default: true,
  })
}

export async function handler({ prompt }) {
  if (!process.env.GITHUB_TOKEN) {
    console.log('You have to set the GITHUB_TOKEN env var')
    process.exit(1)
  }

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
    console.log(
      'A milestone has a next page (i.e. a lot of PRs); this script needs to be updated'
    )
    process.exit(1)
  }

  logSection('Confirming release commits\n')
  if (!isYes(await question('Did you update the release commits? [Y/n] > '))) {
    console.log('Run `get-release-commits --no-cache` first')
    process.exit(1)
  }
  console.log()

  logSection('Confirming PRs in milestones\n')
  console.log(
    chalk.dim(
      'If you see more than one version here (e.g. v3.6.0 and v3.5.0), you need to close the older one(s)\n'
    )
  )

  const answer = await question(
    `Ok to review PRs in milestone ${nodes
      .map((node) => node.title)
      .join(', ')} ? [Y/n/] > `
  )
  console.log()

  if (answer === 'n') {
    await `open https://github.com/redwoodjs/redwood/milestones`
    process.exit(1)
  }

  await updateRemotes()

  const prs = nodes
    .flatMap((milestone) => {
      return milestone.pullRequests.nodes.map((pr) => {
        pr.mergeCommit.message = pr.mergeCommit.message.split('\n').shift()

        return {
          ...pr,
          milestone: milestone.title,
        }
      })
    })
    .filter((pr) => !IGNORE_LIST.includes(pr.id))

  const milestoneTitlesToIds = nodes.reduce((obj, { title, id }) => {
    obj[title] = id
    return obj
  }, {})

  const branch = await getReleaseBranch()
  console.log()

  const validateMilestone = makeValidateMilestone.bind({
    prompt,
    octokit,
    milestoneTitlesToIds,
  })

  for (const pr of prs) {
    console.log(separator)

    if (await isCommitInReleaseBranch(pr.mergeCommit.message)) {
      await validateMilestone(pr, branch.split('/')[2])
      continue
    }

    if (await isCommitInRef('next', sanitizeMessage(pr.mergeCommit.message))) {
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

async function isCommitInReleaseBranch(message) {
  const { releaseCommits } = await getReleaseCommits()
  return releaseCommits.some((commit) => commit.message === message)
}

async function makeValidateMilestone(pr, milestone) {
  const hasCorrectMilestone = pr.milestone === milestone

  console.log()
  console.log(
    [
      `  ${chalk.dim(pr.id)} #${chalk.yellow(pr.number)} ${chalk.blue(
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
    if (this.prompt) {
      answer = await question('  ok to fix? [Y/n/o(pen)] > ')
    }

    if (['open', 'o'].includes(answer)) {
      await $`open https://github.com/redwoodjs/redwood/pull/${pr.number}`
      continue
    }

    if (isYes(answer)) {
      console.log(
        `  ${chalk.blue('fixing')}: milestoning #${chalk.yellow(
          pr.number
        )} ${chalk.magenta(milestone)}`
      )
      await this.octokit.graphql(milestonePullRequest, {
        pullRequestId: pr.id,
        milestoneId: this.milestoneTitlesToIds[milestone],
      })
    }

    console.log(`  ${chalk.green('done')}`)

    break
  }
}

const milestonePullRequest = `
  mutation MilestonePullRequest($pullRequestId: ID!, $milestoneId: ID!) {
    updatePullRequest(
      input: { pullRequestId: $pullRequestId, milestoneId: $milestoneId }
    ) {
      clientMutationId
    }
  }
`

const IGNORE_LIST = [
  // #4992 feat(react): Upgrade to React 18
  'PR_kwDOC2M2f841h3bY',
  // #6907 Layer0 Deploy: Rebrand Layer0 to Edgio
  'PR_kwDOC2M2f85C-w22',
  // #7620 chore(deps): update dependency @types/react to v18.0.28
  'PR_kwDOC2M2f85JxmdM',
  // #7644 chore(deps): update dependency @types/react-dom to v18.0.11
  'PR_kwDOC2M2f85KDuhJ',
]
