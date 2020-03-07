#!/usr/bin/env node
import path from 'path'

import yargs from 'yargs'
import { getPaths } from '@redwoodjs/internal'
import { config } from 'dotenv-defaults'

config({
  path: path.join(getPaths().base, '.env'),
  encoding: 'utf8',
  defaults: path.join(getPaths().base, '.env.defaults'),
})

// eslint-disable-next-line no-unused-expressions
yargs.commandDir('./commands').demandCommand().argv
