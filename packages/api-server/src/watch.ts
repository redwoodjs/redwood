#!/usr/bin/env node

import { fork } from 'child_process'
import type { ChildProcess } from 'child_process'
import fs from 'fs'
import path from 'path'

import c from 'ansi-colors'
import chalk from 'chalk'
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
    if (getConfig().experimental.opentelemetry.enabled) {
      // We expect the OpenTelemetry SDK setup file to be in a specific location
      const opentelemetrySDKScriptPath = path.join(
        getPaths().api.dist,
        'opentelemetry.js'
      )
      const opentelemetrySDKScriptPathRelative = path.relative(
        getPaths().base,
        opentelemetrySDKScriptPath
      )
      console.log(
        `Setting up OpenTelemetry using the setup file: ${opentelemetrySDKScriptPathRelative}`
      )
      if (fs.existsSync(opentelemetrySDKScriptPath)) {
        forkOpts.execArgv = forkOpts.execArgv.concat([
          `--require=${opentelemetrySDKScriptPath}`,
        ])
      } else {
        console.error(
          `OpenTelemetry setup file does not exist at ${opentelemetrySDKScriptPathRelative}`
        )
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

// NOTE: the file comes through as a unix path, even on windows
// So we need to convert the rwjsPaths

const IGNORED_API_PATHS = [
  'api/dist', // use this, because using rwjsPaths.api.dist seems to not ignore on first build
  rwjsPaths.api.types,
  rwjsPaths.api.db,
].map((path) => ensurePosixPath(path))

chokidar
  .watch(rwjsPaths.api.base, {
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
    // On sufficiently large projects (500+ files, or >= 2000 ms build times) on older machines, esbuild writing to the api directory
    // makes chokidar emit an `addDir` event. This starts an infinite loop where the api starts building itself as soon as it's finished.
    // This could probably be fixed with some sort of build caching.
    if (eventName === 'addDir' && filePath === rwjsPaths.api.base) {
      return
    }

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
      c.dim(`[${eventName}] ${filePath.replace(rwjsPaths.api.base, '')}`)
    )
    delayRestartServer.cancel()
    delayRestartServer()
  })
