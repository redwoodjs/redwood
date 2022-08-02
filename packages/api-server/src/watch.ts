#!/usr/bin/env node

import { fork } from 'child_process'
import type { ChildProcess } from 'child_process'
import path from 'path'

import c from 'ansi-colors'
import chokidar from 'chokidar'
import dotenv from 'dotenv'
import { debounce } from 'lodash'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { buildApi } from '@redwoodjs/internal/dist/build/api'
import { getConfig } from '@redwoodjs/internal/dist/config'
import { getPaths, ensurePosixPath } from '@redwoodjs/internal/dist/paths'
import { loadAndValidateSdls } from '@redwoodjs/internal/dist/validateSchema'

const argv = yargs(hideBin(process.argv))
  .option('debug-port', {
    alias: 'dp',
    description: 'Debugging port',
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
    const debugPort = argv['debug-port']
    if (debugPort) {
      forkOpts.execArgv = forkOpts.execArgv.concat([`--inspect=${debugPort}`])
    }

    // Start API server
    httpServerProcess = fork(
      path.join(__dirname, 'index.js'),
      ['api', '--port', getConfig().api.port.toString()],
      forkOpts
    )
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
