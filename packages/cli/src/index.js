#!/usr/bin/env node
import path from 'path'

import { config } from 'dotenv-defaults'
import yargs from 'yargs'

import { getPaths } from '@redwoodjs/internal'

config({
  path: path.join(getPaths().base, '.env'),
  encoding: 'utf8',
  defaults: path.join(getPaths().base, '.env.defaults'),
})

// TODO:
// Add structure and rwjsPaths to global context.
// Add 'cwd' command.

// eslint-disable-next-line no-unused-expressions
yargs
  .commandDir('./commands')
  .scriptName('rw')
  .example(
    'yarn rw g page home /',
    "\"Create a page component named 'Home' at path '/'\""
  )
  .demandCommand()
  .strict().argv
