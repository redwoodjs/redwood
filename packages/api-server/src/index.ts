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

if (require.main === module) {
  yargs(hideBin(process.argv))
    .scriptName('rw-server')
    .usage('usage: $0 <side>')
    .strict()

    .command(
      '$0',
      'Run both api and web servers',
      // @ts-expect-error just passing yargs though
      (yargs) => {
        yargs.options(commonOptions)
      },
      bothServerHandler
    )
    .command(
      'api',
      'Start server for serving only the api',
      // @ts-expect-error just passing yargs though
      (yargs) => {
        yargs.options(apiCliOptions)
      },
      apiServerHandler
    )
    .command(
      'web',
      'Start server for serving only the web side',
      // @ts-expect-error just passing yargs though
      (yargs) => {
        yargs.options(webCliOptions)
      },
      webServerHandler
    )
    .parse()
}
