#!/usr/bin/env node

import { fork } from 'child_process'
import type { ChildProcess } from 'child_process'
import path from 'path'

import c from 'ansi-colors'
import chokidar from 'chokidar'
import dotenv from 'dotenv'
import { debounce } from 'lodash'

import { getPaths, buildApi, getConfig } from '@redwoodjs/internal'

const rwjsPaths = getPaths()

dotenv.config({
  path: rwjsPaths.base,
})

// TODO:
// 1. Move this file out of the HTTP server, and place it in the CLI?

let httpServerProcess: ChildProcess

const rebuildApiServer = () => {
  try {
    // Shutdown API server
    httpServerProcess?.emit('exit')
    httpServerProcess?.kill()

    const buildTs = Date.now()
    process.stdout.write(c.dim(c.italic('Building... ')))
    buildApi()
    console.log(c.dim(c.italic('Took ' + (Date.now() - buildTs) + ' ms')))

    // Start API server
    httpServerProcess = fork(path.join(__dirname, 'index.js'), [
      '--port',
      getConfig().api.port.toString(),
    ])
  } catch (e) {
    console.error(e)
  }
}

// We want to delay exection when multiple files are modified on the filesystem,
// this usually happens when running RedwoodJS generator commands.
// Local writes are very fast, but writes in e2e environments are not,
// so allow the default to be adjust with a env-var.
const delayRestartServer = debounce(
  rebuildApiServer,
  process.env.RWJS_DELAY_RESTART
    ? parseInt(process.env.RWJS_DELAY_RESTART, 10)
    : 5
)

chokidar
  .watch(rwjsPaths.api.base, {
    persistent: true,
    ignoreInitial: true,
    ignored: (file: string) => {
      const x =
        file.includes('node_modules') ||
        file.includes(rwjsPaths.api.dist) ||
        file.includes(rwjsPaths.api.types) ||
        file.includes(rwjsPaths.api.db) ||
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
  })
  .on('all', (eventName, filePath) => {
    console.log(
      c.dim(`[${eventName}] ${filePath.replace(rwjsPaths.api.base, '')}`)
    )
    delayRestartServer.cancel()
    delayRestartServer()
  })
