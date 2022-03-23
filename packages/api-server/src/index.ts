#!/usr/bin/env node
import yargs from 'yargs'

import { ensurePosixPath } from '@redwoodjs/internal'

import {
  apiCliOptions,
  webCliOptions,
  commonOptions,
  apiServerHandler,
  webServerHandler,
  bothServerHandler,
} from './cliHandlers'

const commandPath = yargs.argv.$0

const positionalArgs = yargs.argv._

// "bin": {
//   "rw-api-server-watch": "./dist/watch.js",
//   "rw-log-formatter": "./dist/logFormatter/bin.js",
//   "rw-server": "./dist/index.js"
// },

if (require.main === module) {
  if (
    ensurePosixPath(commandPath).includes('dist/index.js') ||
    (positionalArgs.includes('api') && !positionalArgs.includes('web'))
  ) {
    apiServerHandler(yargs.options(apiCliOptions).argv)
  } else if (
    positionalArgs.includes('web') &&
    !positionalArgs.includes('api')
  ) {
    webServerHandler(yargs.options(webCliOptions).argv)
  } else {
    bothServerHandler(yargs.options(commonOptions).argv)
  }
}
