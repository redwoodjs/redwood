#!/usr/bin/env node

import yargs from 'yargs'

yargs.commandDir('./commands').demandCommand().argv
