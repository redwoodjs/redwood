#!/usr/bin/env node
/* eslint-env node */

import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import * as generateReleaseNotesCommand from './generateReleaseNotesCommand.mjs'
import * as getReleaseCommitsCommand from './getReleaseCommitsCommand.mjs'
import * as releaseCommand from './releaseCommand.mjs'
import * as triageMainCommand from './triageMainCommand.mjs'
import * as triageNextCommand from './triageNextCommand.mjs'
import * as validateMilestonesCommand from './validateMilestonesCommand.mjs'

yargs(hideBin(process.argv))
  .demandCommand()
  .strict()
  .command(generateReleaseNotesCommand)
  .command(getReleaseCommitsCommand)
  .command(releaseCommand)
  .command(triageMainCommand)
  .command(triageNextCommand)
  .command(validateMilestonesCommand)
  .parse()
