#!/usr/bin/env node
/* eslint-env node, es6*/
import { Octokit } from 'octokit'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

// If the user didn't provide a GitHub token, exit early.
if (!process.env.GITHUB_TOKEN) {
  console.log()
  console.error(
    `  You have to provide a GitHub personal-access token (PAT) by setting it to an env var named "GITHUB_TOKEN"`
  )
  console.error(
    `  You can provision a PAT here: https://github.com/settings/tokens`
  )
  console.log()
  process.exit(1)
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

yargs(hideBin(process.argv))
  .command(
    'update-next-release-prs-milestone <milestone>',
    'Update the milestone of next-release PRs',
    (yargs) => {
      yargs.positional('milestone', {
        describe: 'the milestone to update next-release PRs to',
        type: 'string',
      })
    },
    (argv) => updateNextReleasePRsMilestone(argv.milestone)
  )
  .parse()

/**
 * @param {string} nextVersion
 */
export default async function updateNextReleasePRsMilestone(nextVersion) {
  // GitHub doesn't have a GraphQL API for creating milestones, so REST it is.
  const {
    data: { node_id: nextVersionId, number: nextVersionNumber },
  } = await octokit.request('POST /repos/{owner}/{repo}/milestones', {
    owner: 'redwoodjs',
    repo: 'redwood',
    title: nextVersion,
  })

  // Get the next-release milestone's id.
  const {
    repository: { milestones },
  } = await octokit.graphql(`
    {
      repository(owner: "redwoodjs", name: "redwood") {
        milestones(query: "next-release", first: 5) {
          nodes {
            title
            id
          }
        }
      }
    }
  `)

  const { id: nextReleaseMilestoneId } = milestones.nodes.find(
    (milestone) => milestone.title === 'next-release'
  )

  // Get all the PRs with the next-release milestone.
  const {
    node: { pullRequests },
  } = await octokit.graphql(
    `
      query GetNextReleasePullRequests($milestoneId: ID!) {
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
    `,
    {
      milestoneId: nextReleaseMilestoneId,
    }
  )

  // Change all the PRs milestone to nextVersion.
  const pullRequestPromises = pullRequests.nodes.map((pullRequest) =>
    octokit.graphql(
      `
          mutation UpdatePullRequestMilestone($pullRequestId: ID!, $milestoneId: ID!) {
            updatePullRequest(
              input: { pullRequestId: $pullRequestId, milestoneId: $milestoneId }
            ) {
              clientMutationId
            }
          }
        `,
      {
        pullRequestId: pullRequest.id,
        milestoneId: nextVersionId,
      }
    )
  )

  await Promise.all(pullRequestPromises)

  // Close the milestone we just created.
  return octokit.request(
    'POST /repos/{owner}/{repo}/milestones/{milestone_number}',
    {
      owner: 'redwoodjs',
      repo: 'redwood',
      milestone_number: nextVersionNumber,
      state: 'closed',
    }
  )
}
