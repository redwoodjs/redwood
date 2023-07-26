#!/usr/bin/env node

import path from 'node:path'

// TODO: Why did I have to add @types/dotenv-defaults for this here but not in the web-server package?
import { config } from 'dotenv-defaults/config'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { coerceRootPath } from '@redwoodjs/fastify-shared'
import { getConfig } from '@redwoodjs/project-config'
import { getPaths } from '@redwoodjs/project-config'

import { handler as cliHandler } from './cliHandler'
import { Options } from './types'

yargs(hideBin(process.argv))
  .command<Options>(
    '$0',
    'Start server for serving only the api side',
    (yargs) =>
      yargs.options({
        port: {
          default: getConfig().api?.port ?? 8911,
          type: 'number',
          alias: 'p',
        },
        socket: { type: 'string' },
        apiRootPath: {
          alias: ['api-root-path', 'rootPath', 'root-path'],
          default: '/',
          type: 'string',
          desc: 'Root path where your api functions are served',
          // MARK: We now have an import cost to @redwoodjs/fastify-shared because of this
          coerce: coerceRootPath,
        },
      }),
    async (options) => {
      const redwoodProjectPaths = getPaths()

      // Load .env files
      config({
        path: path.join(redwoodProjectPaths.base, '.env'),
        defaults: path.join(redwoodProjectPaths.base, '.env.defaults'),
        // FIXME: This isn't a valid option - don't we use it everywhere!?
        multiline: true,
      })

      cliHandler(options)
    }
  )
  .parse()
