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

// ------------------------

const main = async () => {
  const [title] = process.argv.slice(2)

  console.log()
  console.log(`Getting PRs for milestone "${title}"`)

  const octokit = new Octokit({
    ...(process.env.GITHUB_TOKEN && { auth: process.env.GITHUB_TOKEN }),
  })

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

  // format and write
  // ------------------------

  const fileName = `${title}-release-notes.md`

  console.log(`Written to "${fileName}"`)

  const formattedPRs = pullRequests.nodes.map(formatPR)
  fs.writeFileSync(fileName, formattedPRs.join('\n'))

  console.log('Done')
  console.log()
}

main()
