import http from 'node:http'

import chokidar from 'chokidar'
import execa from 'execa'
import { rimraf } from 'rimraf'

import { getPaths } from '@redwoodjs/project-config'

import { buildFeServer } from './buildFeServer.js'

export const startLiveReload = async () => {
  let child: execa.ExecaChildProcess
  let client: http.ServerResponse

  const rwjsPaths = getPaths()

  const sendReloadEvent = () => {
    if (typeof client !== 'undefined') {
      client.write('event: reload\n')
      client.write('data: \n\n')
    }
  }

  const cleanAndBuild = async () => {
    await rimraf.rimraf(rwjsPaths.web.dist)
    await rimraf.rimraf(rwjsPaths.api.dist)

    await buildFeServer({ verbose: false, webDir: rwjsPaths.web.base })
  }

  const runFrontendServer = () => {
    // NOTE: We explicitly run this via `execa.node` because we need this process to
    // support IPC.
    const child = execa.node(
      './node_modules/@redwoodjs/vite/dist/runFeServer.js',
      {
        cwd: rwjsPaths.base,
        stdio: 'inherit',
        env: {
          NODE_OPTIONS: '--conditions react-server',
        },
      },
    )

    child.addListener('message', (m) => {
      console.log('🐢 received message from `runFeServer`', m)
      if (m === 'server ready') {
        sendReloadEvent()
      }
    })

    return child
  }

  const watcher = chokidar.watch('(web|api)/src/**/*.{ts,js,jsx,tsx}', {
    persistent: true,
    ignored: ['node_modules', '.redwood'],
    ignoreInitial: true,
    cwd: rwjsPaths.base,
    awaitWriteFinish: true,
  })

  process.stdin.on('data', async (data) => {
    const str = data.toString().trim().toLowerCase()
    if (str !== 'rs') {
      return
    }

    try {
      child.kill()
    } catch (e) {
      console.log(e)
    }
    await cleanAndBuild()
    child = runFrontendServer()

    try {
      await child
    } catch (e) {
      console.log('.....')
    }
  })

  watcher
    .on('ready', async () => {
      await cleanAndBuild()
      child = runFrontendServer()

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
        console.log('[live reload started]')
      } catch (e) {
        console.log('.....', e)
      }
    })
    .on('all', async (eventName, p) => {
      console.log('[live reload] event', eventName, p)

      child.kill()
      await cleanAndBuild()
      child = runFrontendServer()

      try {
        await child
      } catch (e) {
        console.log('.....')
      }
    })
}
