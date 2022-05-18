#!/usr/bin/env node
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {
  getApiCliOptions,
  getWebCliOptions,
  getCommonOptions,
  apiServerHandler,
  webServerHandler,
  bothServerHandler,
} from './cliHandlers'

const positionalArgs = yargs(hideBin(process.argv)).parseSync()._

// "bin": {
//   "rw-api-server-watch": "./dist/watch.js",
//   "rw-log-formatter": "./dist/logFormatter/bin.js",
//   "rw-server": "./dist/index.js"
// },

if (require.main === module) {
  if (positionalArgs.includes('api') && !positionalArgs.includes('web')) {
    apiServerHandler(
      yargs(hideBin(process.argv)).options(getApiCliOptions()).parseSync()
    )
  } else if (
    positionalArgs.includes('web') &&
    !positionalArgs.includes('api')
  ) {
    webServerHandler(
      yargs(hideBin(process.argv)).options(getWebCliOptions()).parseSync()
    )
  } else {
    bothServerHandler(
      yargs(hideBin(process.argv)).options(getCommonOptions()).parseSync()
    )
  }
}
