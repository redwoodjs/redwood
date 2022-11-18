#!/usr/bin/env node
/* eslint-env node, es2022 */

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { $ } from 'zx'

import * as findPRCommand from './findPRCommand.mjs'
import * as triageMainCommand from './triageMainCommand.mjs'
import * as triageNextCommand from './triageNextCommand.mjs'
import * as validateMilestonesCommand from './validateMilestonesCommand.mjs'

// Make sure we're on the branch-strategy-triage branch

$.verbose = false

const gitBranchPO = await $`git branch --show-current`

if (gitBranchPO.stdout.trim() !== 'branch-strategy-triage') {
  console.log(`Start from branch-strategy-triage`)
  process.exit(1)
}

$.verbose = true

yargs(hideBin(process.argv))
  // Config
  .scriptName('branch-strategy')
  .demandCommand()
  .strict()
  // Commands
  .command(triageMainCommand)
  .command(triageNextCommand)
  .command(findPRCommand)
  .command(validateMilestonesCommand)
  // Run
  .parse()
