#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { ChildProcess } from 'child_process'
import { fork } from 'child_process'
import fs from 'fs'
import path from 'path'

import c from 'ansi-colors'
import chalk from 'chalk'
import dotenv from 'dotenv'
import { debounce } from 'lodash'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { buildApi, watchApi } from '@redwoodjs/internal/dist/build/api'
import { getConfig, getPaths, resolveFile } from '@redwoodjs/project-config'

const argv = yargs(hideBin(process.argv))
  .option('debug-port', {
    alias: 'dp',
    description: 'Debugging port',
    type: 'number',
  })
  .option('port', {
    alias: 'p',
    description: 'Port',
    type: 'number',
  })
  .help()
  .alias('help', 'h')
  .parseSync()

const rwjsPaths = getPaths()

dotenv.config({
  path: rwjsPaths.base,
})

let httpServerProcess: ChildProcess

const killApiServer = () => {
  httpServerProcess?.emit('exit')
  httpServerProcess?.kill()
}

// @TODO need to enable validation
// const validate = async () => {
//   try {
//     await loadAndValidateSdls()
//     return true
//   } catch (e: any) {
//     killApiServer()
//     console.log(c.redBright(`[GQL Server Error] - Schema validation failed`))
//     console.error(c.red(e?.message))
//     console.log(c.redBright('-'.repeat(40)))

//     delayRestartServer.cancel()
//     return false
//   }
// }

const rebuildApiServer = async () => {
  try {
    // Shutdown API server
    killApiServer()

    const buildTs = Date.now()
    process.stdout.write(c.dim(c.italic('Building... ')))
    await buildApi()
    console.log(c.dim(c.italic('Took ' + (Date.now() - buildTs) + ' ms')))

    const forkOpts = {
      execArgv: process.execArgv,
    }

    // OpenTelemetry SDK Setup
    if (getConfig().experimental.opentelemetry.enabled) {
      const opentelemetrySDKScriptPath =
        getConfig().experimental.opentelemetry.apiSdk
      if (opentelemetrySDKScriptPath) {
        console.log(
          `Setting up OpenTelemetry using the setup file: ${opentelemetrySDKScriptPath}`
        )
        if (fs.existsSync(opentelemetrySDKScriptPath)) {
          forkOpts.execArgv = forkOpts.execArgv.concat([
            `--require=${opentelemetrySDKScriptPath}`,
          ])
        } else {
          console.error(
            `OpenTelemetry setup file does not exist at ${opentelemetrySDKScriptPath}`
          )
        }
      }
    }

    const debugPort = argv['debug-port']
    if (debugPort) {
      forkOpts.execArgv = forkOpts.execArgv.concat([`--inspect=${debugPort}`])
    }

    const port = argv.port ?? getConfig().api.port

    // Start API server

    // Check if experimental server file exists
    const serverFile = resolveFile(`${rwjsPaths.api.dist}/server`)
    if (serverFile) {
      const separator = chalk.hex('#ff845e')(
        '------------------------------------------------------------------'
      )
      console.log(
        [
          separator,
          `🧪 ${chalk.green('Experimental Feature')} 🧪`,
          separator,
          'Using the experimental API server file at api/dist/server.js',
          separator,
        ].join('\n')
      )
      httpServerProcess = fork(serverFile, [], forkOpts)
    } else {
      httpServerProcess = fork(
        path.join(__dirname, 'index.js'),
        ['api', '--port', port.toString()],
        forkOpts
      )
    }
  } catch (e) {
    console.error(e)
  }
}

// We want to delay exception when multiple files are modified on the filesystem,
// this usually happens when running RedwoodJS generator commands.
// Local writes are very fast, but writes in e2e environments are not,
// so allow the default to be adjust with a env-var.
const delayRestartServer = debounce(
  rebuildApiServer,
  process.env.RWJS_DELAY_RESTART
    ? parseInt(process.env.RWJS_DELAY_RESTART, 10)
    : 5
)

// Use esbuild's watcher instead of chokidar
watchApi(delayRestartServer)
