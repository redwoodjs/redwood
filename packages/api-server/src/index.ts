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

const positionalArgs = yargs.argv._

// "bin": {
//   "rw-api-server-watch": "./dist/watch.js",
//   "rw-log-formatter": "./dist/logFormatter/bin.js",
//   "rw-server": "./dist/index.js"
// },

if (require.main === module) {
  if (positionalArgs.includes('api') && !positionalArgs.includes('web')) {
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
