#!/usr/bin/env node

import { fork } from 'child_process'
import type { ChildProcess } from 'child_process'
import path from 'path'

import chokidar from 'chokidar'
import dotenv from 'dotenv'

import { build as babelBuild } from '@redwoodjs/core/babel/apiBuild'
import { build as esBuild } from '@redwoodjs/core/esbuild/apiBuild'
import { getPaths } from '@redwoodjs/internal'

const rwjsPaths = getPaths()

dotenv.config({
  path: rwjsPaths.base,
})

let chokidarReady = false
let httpServer: ChildProcess
const tsInitialBuild = Date.now()

// So that we can use await
const startBuildWatcher = async () => {
  console.log('Building API...')

  if (process.env.ESBUILD === '1') {
    const buildResult = await esBuild({ incremental: true })

    process.on('SIGINT', () => {
      console.log()
      console.log('Shutting down... ')
      httpServer.kill()
      buildResult.stop?.()
      console.log('Done.')
      process.exit(0)
    })
    startApiSrcWatcher(buildResult?.rebuild)
  } else {
    // First  build
    try {
      await babelBuild({
        watch: false,
      })
    } catch (e) {
      process.exit(1)
    }

    process.on('SIGINT', () => {
      console.log()
      console.log('Shutting down... ')
      httpServer.kill()
      console.log('Done.')
      process.exit(0)
    })

    startApiSrcWatcher(() => babelBuild())
  }

  httpServer = fork(path.join(__dirname, 'index.js'))
}

/**
 *
 * @param onChange the rebuild function, based on whether esbuild or babel is being used
 */
function startApiSrcWatcher(onChange?: (filePath: string) => void) {
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
        await onChange?.(filePath)
        console.log('Built in', Date.now() - tsRebuild, 'ms')

        // Restart HTTP...
        httpServer.emit('exit')
        httpServer.kill()
        httpServer = fork(path.join(__dirname, 'index.js'))
      } catch (e) {
        console.error(e)
      }
    })
}

startBuildWatcher()
