#!/usr/bin/env node
/* eslint-disable no-undef */
/* eslint-env node, es6*/

const fs = require('fs')

const { Octokit } = require('octokit')

// ------------------------

const milestonesQuery = `
  query($title: String!) {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(query: $title, first: 10) {
        nodes {
          title
          id
        }
      }
    }
  }
`

const prsQuery = `
  query($id: ID!) {
    node(id: $id) {
      ... on Milestone {
        title
        pullRequests(first: 100) {
          nodes {
            number
            title
            author {
              login
              url
            }
            url
          }
          totalCount
          pageInfo {
            hasNextPage
          }
        }
      }
    }
  }
`

// a pr looks like...
//
// {
//   "number": 2613,
//   "title": "Scaffold Generator File Organization",
//   "author": {
//     "login": "cjreimer",
//     "url": "https://github.com/cjreimer"
//   },
//   "url": "https://github.com/redwoodjs/redwood/pull/2613"
// }
const formatPR = (pr) =>
  `- ${pr.title} [#${pr.number}](${pr.url}) by [@${pr.author.login}](${pr.author.url})`

const getNoOfUniqueContributors = (prs) => {
  const logins = prs.map((pr) => pr.author.login)
  return new Set(logins).size
}

// ------------------------

const main = async () => {
  const [title] = process.argv.slice(2)

  console.log()
  console.log(`Getting PRs for milestone "${title}"`)

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

  // get the milestone's id
  // ------------------------

  const {
    repository: { milestones },
  } = await octokit.graphql(milestonesQuery, { title })
  const { id } = milestones.nodes.find((milestone) => milestone.title === title)

  // get the PRs
  // ------------------------

  const {
    node: { pullRequests },
  } = await octokit.graphql(prsQuery, { id })

  // - count unique contributors
  // - format PRs
  // ------------------------

  const noOfUniqueContributors = getNoOfUniqueContributors(pullRequests.nodes)
  const formattedPRs = pullRequests.nodes.map(formatPR)

  // write
  // ------------------------

  const fileName = `${title}-release-notes.md`

  fs.writeFileSync(
    fileName,
    [
      `No. of PRs: ${pullRequests.nodes.length}`,
      '',
      `No. of unique contributors: ${noOfUniqueContributors}`,
      '',
      ...formattedPRs,
    ].join('\n')
  )

  console.log(`Written to "${fileName}"`)
  console.log('Done')
  console.log()
}

main()
