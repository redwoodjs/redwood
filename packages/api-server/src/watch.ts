#!/usr/bin/env node

import { fork } from 'child_process'
import path from 'path'

import chokidar from 'chokidar'
import dotenv from 'dotenv'

import { build } from '@redwoodjs/core/esbuild/apiBuild'
import { getPaths } from '@redwoodjs/internal'

const rwjsPaths = getPaths()

dotenv.config({
  path: rwjsPaths.base,
})

const tsInitialBuild = Date.now()
console.log('Building API...')
build({ incremental: true }).then((buildResult) => {
  let chokidarReady = false
  let httpServer = fork(path.join(__dirname, 'index.js'))

  process.on('SIGINT', () => {
    console.log()
    console.log('Shutting down... ')
    httpServer.kill()
    buildResult.stop?.()
    console.log('Done.')
    process.exit(0)
  })

  chokidar
    .watch(rwjsPaths.api.base, {
      persistent: true,
      ignoreInitial: true,
      ignored: (file: string) =>
        file.includes('node_modules') ||
        file.includes(rwjsPaths.api.dist) ||
        file.includes(rwjsPaths.api.types) ||
        file.includes(rwjsPaths.api.db) ||
        [
          '.db',
          '.sqlite',
          '-journal',
          '.test.js',
          '.test.ts',
          '.scenarios.ts',
          '.scenarios.js',
          '.d.ts',
        ].some((ext) => file.endsWith(ext)),
    })
    .on('ready', async () => {
      chokidarReady = true
      console.log('Built in', Date.now() - tsInitialBuild, 'ms')
    })
    .on('all', async (eventName, filePath) => {
      // Chokidar emits when it's initial booting up, let's ignore those.
      if (!chokidarReady) {
        return
      }

      console.log(
        `[${eventName}]`,
        `${filePath.replace(rwjsPaths.api.base, '')}`
      )

      const tsRebuild = Date.now()
      console.log('Building API...')
      try {
        await buildResult?.rebuild?.()
        console.log('Built in', Date.now() - tsRebuild, 'ms')

        // Restart HTTP...
        httpServer.emit('exit')
        httpServer.kill()
        httpServer = fork(path.join(__dirname, 'index.js'))
      } catch (e) {
        console.error(e)
      }
    })
})
