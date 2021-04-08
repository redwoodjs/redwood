#!/usr/bin/env node
import yargs from 'yargs'

import { cliOptions, handler } from './handler'

if (process.argv0 === 'api-server') {
  console.log()
  console.warn(
    '"api-server" is deprecated, please use "rw-api-server" instead.'
  )
  console.log()
}

handler(yargs.options(cliOptions).argv)
