#!/usr/bin/env node

import yargs from 'yargs'

// TODO: Fix the way that the commands are found.
yargs.commandDir('./commands').demandCommand().help().argv
