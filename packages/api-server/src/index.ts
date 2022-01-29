#!/usr/bin/env node
import yargs from 'yargs'

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
//   "rw-api-server": "./dist/index.js",
//   "rw-api-server-watch": "./dist/watch.js",
//   "rw-log-formatter": "./dist/logFormatter/bin.js",
//   "rw-server": "./dist/index.js"
// },

// suggest deprecating rw-api-server in favor of rw-server; TBD

if (require.main === module) {
  if (
    commandPath.includes('.bin/rw-api-server') ||
    commandPath.includes('dist/index.js') ||
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
