#!/usr/bin/env node
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import {
  apiCliOptions,
  webCliOptions,
  commonOptions,
  apiServerHandler,
  webServerHandler,
  bothServerHandler,
} from './cliHandlers'

export * from './types'

const positionalArgs = yargs(hideBin(process.argv)).parseSync()._

// "bin": {
//   "rw-api-server-watch": "./dist/watch.js",
//   "rw-log-formatter": "./dist/logFormatter/bin.js",
//   "rw-server": "./dist/index.js"
// },

if (require.main === module) {
  if (positionalArgs.includes('api') && !positionalArgs.includes('web')) {
    apiServerHandler(
      yargs(hideBin(process.argv)).options(apiCliOptions).parseSync()
    )
  } else if (
    positionalArgs.includes('web') &&
    !positionalArgs.includes('api')
  ) {
    webServerHandler(
      yargs(hideBin(process.argv)).options(webCliOptions).parseSync()
    )
  } else {
    bothServerHandler(
      yargs(hideBin(process.argv)).options(commonOptions).parseSync()
    )
  }
}
