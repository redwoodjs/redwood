#!/usr/bin/env node
/* eslint-env node, es2021 */
import prompts from 'prompts'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import generateReleaseNotes from './generateReleaseNotes.mjs'
import release from './release.mjs'
import updatePRsMilestone from './updatePRsMilestone.mjs'

yargs(hideBin(process.argv))
  .scriptName('release')
  .command(
    '$0',
    'Release RedwoodJS',
    (yargs) => {
      yargs.option('semver', {
        describe: 'Semver to release',
        choices: ['major', 'minor', 'patch'],
      })
      yargs.option('update-prs-milestone', {
        alias: 'prs',
        describe: "Update pull requests' milestones",
        type: 'boolean',
      })
      yargs.option('checkout', {
        alias: 'b',
        describe: 'Checkout the release branch',
        type: 'boolean',
      })
      yargs.option('clean-install-update', {
        alias: 'ciu',
        describe: 'Clean, install, and update the package versions',
        type: 'boolean',
      })
      yargs.option('commit-tag-qa', {
        alias: 'ctq',
        describe: 'Commit, tag, and and run through local QA',
        type: 'boolean',
      })
      yargs.option('generate-release-notes', {
        alias: 'notes',
        describe: 'Generate release notes',
        type: 'boolean',
      })
    },
    async (argv) => {
      prompts.override(argv)
      await release()
    }
  )
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
    'update-prs-milestone',
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
  .help()
  .parse()
