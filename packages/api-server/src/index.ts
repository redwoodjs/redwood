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

function serveApi() {
  apiServerHandler(yargs.options(apiCliOptions).argv)
}

function serveWeb() {
  webServerHandler(yargs.options(webCliOptions).argv)
}

function serveBoth() {
  bothServerHandler(yargs.options(commonOptions).argv)
}

const commandPath = yargs.argv.$0

const positionalArgs = yargs.argv._

// "bin": {
//   "rw-api-server": "./dist/index.js",
//   "rw-api-server-watch": "./dist/watch.js",
//   "rw-log-formatter": "./dist/logFormatter/bin.js",
//   "rw-serve": "./dist/index.js"
// },

// rw-api-server is legacy
// suggest deprecating and moving to rw-serve; TBD

if (require.main === module) {
  if (
    commandPath.includes('rw-api-server') ||
    (positionalArgs.includes('api') && !positionalArgs.includes('web'))
  ) {
    serveApi()
  } else if (
    positionalArgs.includes('web') &&
    !positionalArgs.includes('api')
  ) {
    serveWeb()
    console.log('IT WORKED for rw-serve web')
  } else {
    serveBoth()
  }
}

export { serveApi, serveWeb, serveBoth }
