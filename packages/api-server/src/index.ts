#!/usr/bin/env node

import path from 'path'

import { config } from 'dotenv-defaults'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { getPaths } from '@redwoodjs/project-config'
import * as webServerCLIConfig from '@redwoodjs/web-server'

import {
  apiCliOptions,
  commonOptions,
  apiServerHandler,
  bothServerHandler,
} from './cliHandlers'

export * from './types'

if (!process.env.REDWOOD_ENV_FILES_LOADED) {
  config({
    path: path.join(getPaths().base, '.env'),
    defaults: path.join(getPaths().base, '.env.defaults'),
    multiline: true,
  })

  process.env.REDWOOD_ENV_FILES_LOADED = 'true'
}

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
      webServerCLIConfig.description,
      // @ts-expect-error just passing yargs though
      webServerCLIConfig.builder,
      webServerCLIConfig.handler
    )
    .parse()
}
