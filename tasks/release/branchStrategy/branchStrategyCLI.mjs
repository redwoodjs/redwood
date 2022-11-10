#!/usr/bin/env node
/* eslint-env node, es2022 */

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import * as findPRCommand from './findPRCommand.mjs'
import * as triageMainCommand from './triageMainCommand.mjs'
import * as triageNextCommand from './triageNextCommand.mjs'
import * as validateMilestonesCommand from './validateMilestonesCommand.mjs'

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
