#!/usr/bin/env node
import yargs from 'yargs'

import { apiCliOptions, apiServerHandler } from './cliHandlers'

if (process.argv0 === 'api-server') {
  console.log()
  console.warn(
    '"api-server" is deprecated, please use "rw-api-server" instead.'
  )
  console.log()
}

apiServerHandler(yargs.options(apiCliOptions).argv)
