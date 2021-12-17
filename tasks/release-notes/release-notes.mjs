#!/usr/bin/env node
/* eslint-env node, es6*/

import template from 'lodash.template'
import fs from 'node:fs'
import url from 'node:url'
import { Octokit } from 'octokit'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

/**
 * If the user didn't set a GitHub token, exit early.
 */
if (!process.env.GITHUB_TOKEN) {
  console.log()
  console.error(
    `  You have to provide a github token. Make sure there's a var named GITHUB_TOKEN in your env.`
  )
  console.error(
    `  You can provision an personal access token here: https://github.com/settings/tokens`
  )
  console.log()

  /**
   * There's a few ways we could exit,
   * but `process.exit` actually isn't recommended: {@link https://nodejs.dev/learn/how-to-exit-from-a-nodejs-program}.
   */
  process.kill(process.pid)
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

/**
 * Yargs bindings.
 *
 * @param {typeof yargs} yargs
 */
function builder(yargs) {
  yargs
    .positional('milestone', {
      describe: 'The milestone to generate release notes for',
      type: 'string',
    })
    .example('$0 v0.40.0', 'Build release notes for v0.40.0')
}

const milestonesQuery = `
  query($title: String) {
    repository(owner: "redwoodjs", name: "redwood") {
      milestones(query: $title, first: 3, orderBy: { field: NUMBER, direction: DESC }) {
        nodes {
          title
          id
          pullRequests(first: 100) {
            nodes {
              number
              title
              author {
                login
              }
            }
            totalCount
          }
        }
      }
    }
  }
`

/**
 * This function does pretty much all the work.
 *
 * @param {{
 *   milestone: string,
 * }} argv
 */
async function handler(argv) {
  /**
   * Get the milestone's title, id, and PRs.
   */
  let title = argv.milestone
  let prs

  const {
    repository: { milestones },
  } = await octokit.graphql(milestonesQuery, { title })

  /**
   * If no milestone was provided, use the latest.
   */
  if (title === undefined) {
    console.log(milestones.nodes)
    const [latestMilestone] = milestones.nodes

    title = latestMilestone.title
    prs = latestMilestone.pullRequests.nodes
  } else {
    const milestone = milestones.nodes.find(
      (milestone) => milestone.title === title
    )

    prs = milestone.pullRequests.nodes
  }

  /**
   * Interpolate the template and write to `${cwd}/${milestone}-release-notes.md`.
   *
   * @see {@link https://nodejs.org/docs/latest-v15.x/api/esm.html#esm_no_filename_or_dirname}
   */
  const interpolate = template(
    fs.readFileSync(
      new URL('release-notes.md.template', import.meta.url),
      'utf8'
    )
  )

  const filedata = interpolate({
    uniqueContributors: getNoOfUniqueContributors(prs),
    prsMerged: prs.length,
    ...sortPRs(prs),
  })

  const filename = new URL(`${title}-release-notes.md`, import.meta.url)

  fs.writeFileSync(filename, filedata)

  console.log()
  console.log(`Written to ${url.fileURLToPath(filename)}`)
  console.log('Done')
  console.log()
}

yargs(hideBin(process.argv))
  .scriptName('release-notes')
  .usage(
    '$0 [milestone]',
    'Build release notes for a milestone',
    builder,
    handler
  )
  .help()
  .parse()

/**
 * Helper functions.
 */

/**
 * A helper function for formatting PRs.
 * A `pr` looks like:
 *
 * ```js
 * {
 *   "number": 2613,
 *   "title": "Scaffold Generator File Organization",
 *   "author": {
 *     "login": "cjreimer",
 *     },
 *   }
 * ```
 *
 * @param {{
 *   number: number,
 *   title: string,
 *   author: {
 *     login: string,
 *   }
 * }} pr
 */
function formatPR(pr) {
  return `${pr.title} #${pr.number} by @${pr.author.login}`
}

function getNoOfUniqueContributors(prs) {
  const logins = prs.map((pr) => pr.author.login)
  return new Set(logins).size
}

/**
 * This is just a stub till we have some kind of changesets integration.
 *
 * @param {Array<{
 *   number: number,
 *   title: string,
 *   author: {
 *     login: string,
 *   }
 * }>} prs
 */
function sortPRs(prs) {
  const features = []
  const fixed = []
  const chore = []
  const packageDependencies = []
  const manual = []

  for (const pr of prs) {
    if (pr.author.login === 'renovate') {
      packageDependencies.push(`<li>${formatPR(pr)}</li>`)
      continue
    }

    manual.push(`- ${formatPR(pr)}`)
  }

  return {
    features: features.join('\n'),
    fixed: fixed.join('\n'),
    chore: chore.join('\n'),
    packageDependencies: packageDependencies.join('\n'),
    manual: manual.join('\n'),
  }
}
