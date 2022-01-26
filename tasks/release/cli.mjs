#!/usr/bin/env node
/* eslint-env node, es2021 */
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import generateReleaseNotes from './generateReleaseNotes.mjs'
import release from './release.mjs'
import updateNextReleasePullRequestsMilestone from './updateNextReleasePullRequestsMilestone.mjs'

yargs(hideBin(process.argv))
  .scriptName('release')
  .command('$0', 'Release RedwoodJS', {}, release)
  .command(
    'generate-release-notes [milestone]',
    'Generates release notes for a given milestone',
    (yargs) => {
      yargs.positional('milestone', {
        describe: 'The milestone to generate release notes for',
        type: 'string',
      })
    },
    (argv) => generateReleaseNotes(argv.milestone)
  )
  .command(
    'update-next-release-prs-milestone <milestone>',
    "Update next-release PRs' milestone. Note that this creates the milestone if it doesn't exist",
    (yargs) => {
      yargs.positional('milestone', {
        describe: 'The milestone to update next-release PRs to',
        type: 'string',
      })
    },
    (argv) => updateNextReleasePullRequestsMilestone(argv.milestone)
  )
  .help()
  .parse()
