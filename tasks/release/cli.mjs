#!/usr/bin/env node
/* eslint-env node, es2021 */

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import generateReleaseNotes from './generateReleaseNotes.mjs'
import release, { versionDocs } from './release.mjs'
import updatePRsMilestone from './updatePRsMilestone.mjs'

yargs(hideBin(process.argv))
  .scriptName('release')
  .command('$0', 'Release RedwoodJS', async () => {
    await release()
  })
  .command(
    ['generate-release-notes [milestone]', 'notes'],
    'Generates release notes for a given milestone',
    (yargs) => {
      yargs.positional('milestone', {
        describe: 'The milestone to generate release notes for',
        type: 'string',
      })

      yargs.option('release-candidate', {
        alias: 'rc',
        default: false,
        describe: 'Generate release notes for a release candidate',
        type: 'boolean',
      })
    },
    (argv) =>
      generateReleaseNotes(argv.milestone, {
        releaseCandidate: argv.releaseCandidate,
      })
  )
  .command(
    ['update-prs-milestone', 'prs'],
    "Update PRs' milestone from something to something",
    (yargs) => {
      yargs.option('from', {
        demandOption: true,
        describe: 'The milestone to PRs from',
        type: 'string',
      })
      yargs.option('to', {
        demandOption: true,
        describe: 'The milestone to PRs to',
        type: 'string',
      })
    },
    ({ from, to }) => updatePRsMilestone(from, to)
  )
  .command(
    ['version-docs <next-version>', 'docs'],
    'Version docs',
    (yargs) => {
      yargs.positional('next-version', {
        description:
          'The next version to version the docs to. Should be something like "1.5"—without the v, without the last 0',
        type: 'string',
      })
    },
    ({ nextVersion }) => versionDocs(nextVersion)
  )
  .help()
  .parse()
