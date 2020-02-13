#!/usr/bin/env node

import yargs from 'yargs'

// eslint-disable-next-line no-unused-expressions
yargs.commandDir('./commands').demandCommand().argv
