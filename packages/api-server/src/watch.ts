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
process.stdout.write('Building API...')
build({ incremental: true }).then((buildResult) => {
  let chokidarReady = false
  let httpServer = fork(path.join(__dirname, 'index.js'))
  process.on('SIGINT', () => {
    console.log()
    process.stdout.write('Shutting down... ')
    httpServer.kill()
    buildResult.stop?.()
    console.log('Done.')
    process.exit(0)
  })

  chokidar
    .watch(rwjsPaths.api.base, {
      persistent: true,
      ignored: ['*.test.*', '*.scenarios.*', rwjsPaths.api.dist],
    })
    .on('ready', async () => {
      chokidarReady = true
      console.log(Date.now() - tsInitialBuild, 'ms')
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
      process.stdout.write('Building API...')
      await buildResult?.rebuild?.()
      console.log(Date.now() - tsRebuild, 'ms')

      // Restart HTTP...
      httpServer.emit('exit')
      httpServer.kill()
      httpServer = fork(path.join(__dirname, 'index.js'))
    })
})
