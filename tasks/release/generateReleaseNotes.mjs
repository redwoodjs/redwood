/* eslint-env node */

import { parseArgs as _parseArgs } from 'node:util'

import { fs } from 'zx'

import {
  consoleBoxen,
  getMilestones,
  getPRsWithMilestone,
  prompts,
} from './releaseLib.mjs'

const coreDependenciesRegex = new RegExp(
  [
    '@apollo/client',
    'babel',
    'fastify',
    'prisma',
    'react-hook-form',
    'storybook ',
    'vite',
    'webpack',
    'yarn',
  ].join('|')
)

export async function main() {
  let options

  try {
    options = await parseArgs()
  } catch (e) {
    consoleBoxen('👷 Heads up', e.message)
    process.exitCode = 1
    return
  }

  const { milestone } = options

  let prs = await getPRsWithMilestone(milestone)

  prs = prs
    // Sort by when a PR was merged from least recently to most.
    .sort(
      (a, b) => new Date(a.mergedAt).getTime() - new Date(b.mergedAt).getTime()
    )
    .map((pr) => {
      // Get the PR's type from its release label.
      const releaseLabel = pr.labels.nodes.find((label) =>
        label.name.startsWith('release:')
      )

      const releaseNotesEntry = [
        `- ${pr.title} #${pr.number} by @${pr.author.login}`,
        '',
        // Indent the body for proper markdown rendering.
        pr.body
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n'),
      ]
        .join('\n')
        .trim()

      return {
        ...pr,
        type: releaseLabel.name.replace('release:', ''),
        releaseNotesEntry,
      }
    })
    // Handle docs.
    .map((pr) => {
      if (pr.type !== 'docs') {
        return pr
      }

      return {
        ...pr,
        releaseNotesEntry: `- ${pr.title} #${pr.number} by @${pr.author.login}`,
      }
    })
    // Handle renovate.
    .map((pr) => {
      if (pr.author.login !== 'renovate') {
        return pr
      }

      return {
        ...pr,
        type: 'dependency',
        releaseNotesEntry: `<li>${pr.title} #${pr.number}</li>`,
      }
    })
    // Handle core dependencies.
    .map((pr) => {
      if (!coreDependenciesRegex.test(pr.title)) {
        return pr
      }

      return {
        ...pr,
        type: 'core-dependency',
        releaseNotesEntry: `- ${pr.title} #${pr.number}`,
      }
    })

  // Make an object of release types to PRs:
  //
  // ```js
  // {
  //   feature: [{ ... }],
  //   docs: [{ ... }],
  //   chore: [{ ... }],
  // }
  // ```
  const releaseTypesToPRs = prs.reduce((releaseTypesToPRs, pr) => {
    releaseTypesToPRs[pr.type] ??= []
    releaseTypesToPRs[pr.type].push(pr)
    return releaseTypesToPRs
  }, {})

  // Write the release notes.
  const releaseNotes = Object.entries(releaseTypesToPRs)
    .flatMap(([type, prs]) => {
      if (type === 'core-dependency') {
        return [
          '## Core Dependencies',
          '',
          ...prs.map((pr) => pr.releaseNotesEntry),
          '',
        ]
      }

      if (type === 'dependency') {
        return [
          '## Dependencies',
          '',
          '<details>',
          '<summary>Click to see all upgraded dependencies</summary>',
          '<ul>',
          ...prs.map((pr) => pr.releaseNotesEntry),
          '</ul>',
          '</details>',
          '',
        ]
      }

      return [
        `## ${type}`,
        '',
        ...prs.flatMap((pr) => [pr.releaseNotesEntry, '']),
      ]
    })
    .join('\n')

  const filePath = new URL(`./${milestone}_release_notes.md`, import.meta.url)
  await fs.writeFile(filePath, releaseNotes)
  console.log(`📝 Wrote ${milestone} release notes to ${filePath}`)
}

main()

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function parseArgs() {
  const { positionals } = _parseArgs({
    allowPositionals: true,
  })

  let milestone

  if (positionals.length) {
    milestone = positionals[0]
  } else {
    const milestones = await getMilestones()

    const milestoneRes = await prompts({
      name: 'milestone',
      message: 'Select a milestone',
      type: 'select',
      choices: milestones.map((milestone) => {
        return {
          title: milestone.title,
          value: milestone.title,
        }
      }),
    })

    milestone = milestoneRes.milestone
  }

  return {
    milestone,
  }
}
