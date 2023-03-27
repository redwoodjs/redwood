/* eslint-env node */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Octokit } from 'octokit'
import { chalk } from 'zx'

import { getMilestone } from './releaseLib.mjs'

export const command = 'generate-release-notes <milestone>'
export const description = 'Generate release notes for a milestone'

export function builder(yargs) {
  yargs.positional('milestone', {
    describe: 'The milestone to generate release notes for',
    type: 'string',
  })
}

export async function handler({ milestone }) {
  if (!process.env.GITHUB_TOKEN) {
    console.log('You have to set the GITHUB_TOKEN env var')
    process.exit(1)
  }

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

  const { title, id } = await getMilestone.call({ octokit }, milestone)

  const prs = await getPRsWithMilestone.call({ octokit }, { milestoneId: id })

  prs.sort(
    (a, b) => new Date(a.mergedAt).getTime() - new Date(b.mergedAt).getTime()
  )

  const coreDependenciesRegex = new RegExp(
    [
      '@apollo/client',
      'fastify',
      'prisma',
      'react-hook-form',
      'storybook ',
      'yarn',
    ].join('|')
  )

  const {
    breaking,
    features,
    fixed,
    docs,
    coreDependencies,
    chore,
    dependencies,
    rest,
  } = prs.reduce(
    (obj, pr) => {
      if (pr.author.login === 'renovate') {
        if (coreDependenciesRegex.test(pr.title)) {
          obj.coreDependencies.push(`- ${pr.title} #${pr.number}`)
        }

        obj.dependencies.push(`<li>${pr.title} #${pr.number}</li>`)
        return obj
      }

      const labels = pr.labels.nodes.map((label) => label.name)

      // if (labels.includes('release:feature-breaking')) {
      //   obj.breaking.push(`- ${formatPR(pr)}`)
      //   return obj
      // }

      if (labels.includes('release:feature')) {
        obj.features.push(`- ${formatPR(pr)}`)
        return obj
      }

      if (labels.includes('release:fix')) {
        obj.fixed.push(`- ${formatPR(pr)}`)
        return obj
      }

      if (labels.includes('release:chore')) {
        obj.chore.push(`- ${formatPR(pr)}`)
        return obj
      }

      if (labels.includes('release:docs')) {
        obj.docs.push(`- ${formatPR(pr)}`)
        return obj
      }

      obj.rest.push(`- ${formatPR(pr)}`)

      return obj
    },
    {
      breaking: [],
      features: [],
      fixed: [],
      docs: [],
      coreDependencies: [],
      chore: [],
      dependencies: [],
      rest: [],
    }
  )

  const file = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    `${title}-release-notes.md`
  )

  const releaseNotes = [
    '# Changelog',
    '',
    ...(breaking.length ? ['## Breaking', '', ...breaking, ''] : []),
    ...(features.length ? ['## Features', '', ...features, ''] : []),
    ...(fixed.length ? ['## Fixed', '', ...fixed, ''] : []),
    ...(docs.length ? ['## Docs', '', ...docs, ''] : []),
    ...(chore.length ? ['## Chore', '', ...chore, ''] : []),
    ...(coreDependencies.length
      ? ['## Core dependencies', '', ...coreDependencies, '']
      : []),
    ...(dependencies.length
      ? [
          '## Dependencies',
          '',
          '<details>',
          '<summary>Click to see all upgraded dependencies</summary>',
          '<ul>',
          ...dependencies,
          '</ul>',
          '</details>',
          '',
        ]
      : []),
    ...(rest.length ? ['## Rest', '', ...rest, ''] : []),
  ].join('\n')

  fs.writeFileSync(file, releaseNotes)

  console.log(
    `Wrote ${chalk.magenta(milestone)} release notes to ${chalk.magenta(file)}`
  )
}

async function getPRsWithMilestone({ milestoneId, after }) {
  const {
    node: { pullRequests },
  } = await this.octokit.graphql(getPRsWithMilestoneQuery, {
    milestoneId,
    after,
  })

  if (!pullRequests.pageInfo.hasNextPage) {
    return pullRequests.nodes
  }

  const nodes = await getPRsWithMilestone.call(
    { octokit: this.octokit },
    {
      milestoneId,
      after: pullRequests.pageInfo.endCursor,
    }
  )

  return [...pullRequests.nodes, ...nodes]
}

export const getPRsWithMilestoneQuery = `
  query GetPRsWithMilestoneQuery($milestoneId: ID!, $after: String) {
    node(id: $milestoneId) {
      ... on Milestone {
        pullRequests(first: 100, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            number
            title
            author {
              login
            }
            mergedAt
            labels(first: 10) {
              nodes {
                name
              }
            }
          }
          totalCount
        }
      }
    }
  }
`

function formatPR(pr) {
  return `${pr.title} #${pr.number} by @${pr.author.login}`
}
