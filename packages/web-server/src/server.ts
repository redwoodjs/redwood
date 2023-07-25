#!/usr/bin/env node

import path from 'node:path'

import { config } from 'dotenv-defaults'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { getConfig } from '@redwoodjs/project-config'
import { getPaths } from '@redwoodjs/project-config'

import { handler as cliHandler } from './cliHandler'
import { Options } from './types'

yargs(hideBin(process.argv))
  .command<Options>(
    '$0',
    'Start server for serving only the web side',
    (yargs) =>
      yargs.options({
        port: {
          default: getConfig().web?.port ?? 8910,
          type: 'number',
          alias: 'p',
        },
        socket: { type: 'string' },
        apiHost: {
          alias: 'api-host',
          type: 'string',
          desc: 'Forward requests from the apiUrl, defined in redwood.toml to this host',
        },
      }),
    async (options) => {
      const redwoodProjectPaths = getPaths()

      // Load .env files
      config({
        path: path.join(redwoodProjectPaths.base, '.env'),
        defaults: path.join(redwoodProjectPaths.base, '.env.defaults'),
        multiline: true,
      })

      cliHandler(options)
    }
  )
  .parse()
