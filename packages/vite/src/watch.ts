import http from 'node:http'

import chokidar from 'chokidar'
import { type ResultPromise } from 'execa'
import { rimraf } from 'rimraf'

import { getPaths } from '@redwoodjs/project-config'

import { build } from './devRscServer.js'

export const startLiveReload = async () => {
  const { execaNode } = await import('execa')

  let child: ResultPromise
  let client: http.ServerResponse

  const sendReloadEvent = () => {
    if (typeof client !== 'undefined') {
      client.write('event: reload\n')
      client.write('data: \n\n')
    }
  }

  const rwjsPaths = getPaths()

  const watcher = chokidar.watch('(web|api)/src/**/*.{ts,js,jsx,tsx}', {
    persistent: true,
    ignored: ['node_modules', '.redwood'],
    ignoreInitial: true,
    cwd: rwjsPaths.base,
    awaitWriteFinish: true,
  })

  process.stdin.on('data', async (data) => {
    const str = data.toString().trim().toLowerCase()
    if (str === 'rs') {
      await rimraf.rimraf(rwjsPaths.web.dist)
      await rimraf.rimraf(rwjsPaths.api.dist)
      await build()

      try {
        child.kill()
      } catch (e) {
        console.log(e)
      }
      child = execaNode('../node_modules/@redwoodjs/vite/dist/runFeServer.js', {
        ipc: true,
        shell: true,
        stdio: 'inherit',
      })
      if (typeof child !== 'undefined') {
        const m = await child.getOneMessage()
        if (m === 'server ready') {
          sendReloadEvent()
        }
      }

      try {
        await child
      } catch (e) {
        console.log('.....')
      }
    }
  })

  watcher
    .on('ready', async () => {
      console.log('[live reload started]')
      await rimraf.rimraf(rwjsPaths.web.dist)
      await rimraf.rimraf(rwjsPaths.api.dist)
      await build()

      child = execaNode('../node_modules/@redwoodjs/vite/dist/runFeServer.js', {
        ipc: true,
        shell: true,
        stdio: 'inherit',
      })

      http
        .createServer(async (_req, res) => {
          client = res
          res.writeHead(200, {
            'content-type': 'text/event-stream',
            'cache-control': 'no-cache',
            connection: 'keep-alive',
            'access-control-allow-origin': '*',
          })
        })
        .listen(8913)

      try {
        await child
      } catch (e) {
        console.log('.....')
      }
    })
    .on('all', async (eventName, p) => {
      console.log('[live reload] event', eventName, p)
      await rimraf.rimraf(rwjsPaths.web.dist)
      await rimraf.rimraf(rwjsPaths.api.dist)
      await build()

      child.kill()
      child = execaNode('../node_modules/@redwoodjs/vite/dist/runFeServer.js', {
        ipc: true,
      })
      if (typeof child !== 'undefined') {
        const m = await child.getOneMessage()
        if (m === 'server ready') {
          sendReloadEvent()
        }
      }

      try {
        await child
      } catch (e) {
        console.log('.....')
      }
    })
}
