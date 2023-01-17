/* eslint-env node, es2022 */

import { Octokit } from 'octokit'

import {
  updateRemotes,
  isCommitInBranch,
  getReleaseBranch,
} from './branchStrategyLib.mjs'

export const command = 'find-pr <uri>'
export const description = 'Find which branches a PR is in'

export function builder(yargs) {
  yargs.positional('pr', {
    description: 'The PR URL',
    type: 'string',
  })
}

export async function handler({ uri }) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

  await updateRemotes()

  const {
    resource: {
      mergeCommit: { messageHeadline },
    },
  } = await octokit.graphql(
    `
      query GetPR($uri: URI!) {
        resource(url: $uri) {
          ... on PullRequest {
            mergeCommit {
              messageHeadline
            }
          }
        }
      }
    `,
    { uri }
  )

  const isInNext = await isCommitInBranch('next', messageHeadline)
  console.log()
  const releaseBranch = await getReleaseBranch()
  console.log()
  const isInRelease = await isCommitInBranch(releaseBranch, messageHeadline)
  console.log()

  console.log(
    [
      isInNext
        ? '✅ This PR is in the next branch'
        : `❌ This PR isn't the next branch`,
      isInRelease
        ? `✅ This PR is in the ${releaseBranch} branch`
        : `❌ This PR isn't the ${releaseBranch} branch`,
    ].join('\n')
  )
}
