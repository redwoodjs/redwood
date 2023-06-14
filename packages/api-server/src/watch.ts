#!/usr/bin/env node
// This script is called by the `yarn rw dev` command. Specifically, it's the api command.

import { fork } from 'child_process'
import type { ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'

import c from 'ansi-colors'
import chokidar from 'chokidar'
import dotenv from 'dotenv'
import { debounce } from 'lodash'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { buildApi } from '@redwoodjs/internal/dist/build/api'
import { loadAndValidateSdls } from '@redwoodjs/internal/dist/validateSchema'
import {
  getPaths,
  ensurePosixPath,
  getConfig,
  resolveFile,
} from '@redwoodjs/project-config'

const redwoodProjectPaths = getPaths()
const redwoodProjectConfig = getConfig()

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
    default: redwoodProjectConfig.api.port,
  })
  .option('host', {
    description: 'Host',
    type: 'string',
    default: redwoodProjectConfig.api.host,
  })
  .parseSync()

// If this is run via the yarn rw dev command, this will have already been called.
dotenv.config({
  path: redwoodProjectPaths.base,
})

// TODO:
// 1. Move this file out of the HTTP server, and place it in the CLI?

let httpServerProcess: ChildProcess

const killApiServer = () => {
  httpServerProcess?.emit('exit')
  httpServerProcess?.kill()
}

const validate = async () => {
  try {
    await loadAndValidateSdls()
    return true
  } catch (e: any) {
    killApiServer()
    console.log(c.redBright(`[GQL Server Error] - Schema validation failed`))
    console.error(c.red(e?.message))
    console.log(c.redBright('-'.repeat(40)))

    delayRestartServer.cancel()
    return false
  }
}

const rebuildApiServer = () => {
  try {
    // Shutdown API server
    killApiServer()

    const buildTs = Date.now()
    process.stdout.write(c.dim(c.italic('Building... ')))
    buildApi()
    console.log(c.dim(c.italic('Took ' + (Date.now() - buildTs) + ' ms')))

    const forkOpts = {
      execArgv: process.execArgv,
    }

    // OpenTelemetry SDK Setup
    if (redwoodProjectConfig.experimental.opentelemetry.enabled) {
      const opentelemetrySDKScriptPath =
        redwoodProjectConfig.experimental.opentelemetry.apiSdk
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

    // Start API server

    // Check if experimental server file exists
    const serverFile = resolveFile(`${redwoodProjectPaths.api.dist}/server`)
    if (serverFile) {
      httpServerProcess = fork(serverFile, [], forkOpts)
    } else {
      httpServerProcess = fork(
        path.join(__dirname, 'index.js'),
        ['api', '--port', argv.port.toString(), '--host', `${argv.host}`],
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

// NOTE: the file comes through as a unix path, even on windows
// So we need to convert the redwoodProjectPaths

const IGNORED_API_PATHS = [
  'api/dist', // use this, because using redwoodProjectPaths.api.dist seems to not ignore on first build
  redwoodProjectPaths.api.types,
  redwoodProjectPaths.api.db,
].map((path) => ensurePosixPath(path))

chokidar
  .watch(redwoodProjectPaths.api.base, {
    persistent: true,
    ignoreInitial: true,
    ignored: (file: string) => {
      const x =
        file.includes('node_modules') ||
        IGNORED_API_PATHS.some((ignoredPath) => file.includes(ignoredPath)) ||
        [
          '.DS_Store',
          '.db',
          '.sqlite',
          '-journal',
          '.test.js',
          '.test.ts',
          '.scenarios.ts',
          '.scenarios.js',
          '.d.ts',
          '.log',
        ].some((ext) => file.endsWith(ext))
      return x
    },
  })
  .on('ready', async () => {
    rebuildApiServer()
    await validate()
  })
  .on('all', async (eventName, filePath) => {
    // We validate here, so that developers will see the error
    // As they're running the dev server
    if (filePath.includes('.sdl')) {
      const isValid = await validate()

      // Exit early if not valid
      if (!isValid) {
        return
      }
    }

    console.log(
      c.dim(
        `[${eventName}] ${filePath.replace(redwoodProjectPaths.api.base, '')}`
      )
    )
    delayRestartServer.cancel()
    delayRestartServer()
  })
