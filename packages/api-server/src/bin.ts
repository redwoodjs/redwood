import path from 'path'

import { config } from 'dotenv-defaults'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { getPaths } from '@redwoodjs/project-config'
import * as webServerCLIConfig from '@redwoodjs/web-server'

import * as apiServerCLIConfig from './apiCLIConfig'
import { handler as apiHandler } from './apiCLIConfigHandler'
import * as bothServerCLIConfig from './bothCLIConfig'
import { handler as bothHandler } from './bothCLIConfigHandler'

if (!process.env.REDWOOD_ENV_FILES_LOADED) {
  config({
    path: path.join(getPaths().base, '.env'),
    defaults: path.join(getPaths().base, '.env.defaults'),
    multiline: true,
  })

  process.env.REDWOOD_ENV_FILES_LOADED = 'true'
}

process.env.NODE_ENV ??= 'production'

yargs(hideBin(process.argv))
  .scriptName('rw-server')
  .strict()
  .alias('h', 'help')
  .alias('v', 'version')
  .command(
    '$0',
    bothServerCLIConfig.description,
    // @ts-expect-error The yargs types seem wrong; it's ok for builder to be a function
    bothServerCLIConfig.builder,
    bothHandler
  )
  .command(
    'api',
    apiServerCLIConfig.description,
    // @ts-expect-error The yargs types seem wrong; it's ok for builder to be a function
    apiServerCLIConfig.builder,
    apiHandler
  )
  .command(
    'web',
    webServerCLIConfig.description,
    // @ts-expect-error The yargs types seem wrong; it's ok for builder to be a function
    webServerCLIConfig.builder,
    webServerCLIConfig.handler
  )
  .parse()
