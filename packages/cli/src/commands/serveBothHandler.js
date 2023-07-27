import path from 'path'

import chalk from 'chalk'
import execa from 'execa'

import {
  coerceRootPath,
  createFastifyInstance,
  redwoodFastifyAPI,
  redwoodFastifyWeb,
} from '@redwoodjs/fastify'
import { getConfig, getPaths } from '@redwoodjs/project-config'

export const bothExperimentalServerFileHandler = async () => {
  logExperimentalHeader()

  if (getConfig().experimental?.rsc?.enabled) {
    logSkippingFastifyWebServer()

    await execa(
      'node',
      [
        '--conditions react-server',
        './node_modules/@redwoodjs/vite/dist/runRscFeServer.js',
      ],
      {
        cwd: getPaths().base,
        stdio: 'inherit',
        shell: true,
      }
    )
  } else if (getConfig().experimental?.streamingSsr?.enabled) {
    logSkippingFastifyWebServer()

    await execa('yarn', ['rw-serve-fe'], {
      cwd: getPaths().web.base,
      stdio: 'inherit',
      shell: true,
    })
  } else {
    await execa(
      'yarn',
      ['node', path.join('dist', 'server.js'), '--enable-web'],
      {
        cwd: getPaths().api.base,
        stdio: 'inherit',
        shell: true,
      }
    )
  }
}

export const bothRscServerHandler = async (argv) => {
  const { apiServerHandler } = await import('./serveApiHandler.js')

  // TODO (RSC) Allow specifying port, socket and apiRootPath
  const apiPromise = apiServerHandler({
    ...argv,
    port: 8911,
    apiRootPath: '/',
  })

  // TODO (RSC) More gracefully handle Ctrl-C
  const fePromise = execa(
    'node',
    [
      '--experimental-loader @redwoodjs/vite/node-loader',
      '--experimental-loader @redwoodjs/vite/react-node-loader',
      '--conditions react-server',
      './node_modules/@redwoodjs/vite/dist/runRscFeServer.js',
    ],
    {
      cwd: getPaths().base,
      stdio: 'inherit',
      shell: true,
    }
  )

  await Promise.all([apiPromise, fePromise])
}

export const bothSsrServerHandler = async (argv) => {
  const { apiServerHandler } = await import('./serveApiHandler.js')

  // TODO (STREAMING) Allow specifying port, socket and apiRootPath
  const apiPromise = apiServerHandler({
    ...argv,
    port: 8911,
    apiRootPath: '/',
  })

  // TODO (STREAMING) More gracefully handle Ctrl-C
  // Right now you get a big red error box when you kill the process
  const fePromise = execa('yarn', ['rw-serve-fe'], {
    cwd: getPaths().web.base,
    stdio: 'inherit',
    shell: true,
  })

  await Promise.all([apiPromise, fePromise])
}

export const bothServerHandler = async (options) => {
  const { port, socket } = options
  const tsServer = Date.now()

  console.log(chalk.italic.dim('Starting API and Web Servers...'))

  const fastify = createFastifyInstance()

  process.on('exit', () => {
    fastify?.close()
  })

  await fastify.register(redwoodFastifyWeb, {
    redwood: {
      ...options,
    },
  })

  const apiRootPath = coerceRootPath(getConfig().web.apiUrl)

  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      ...options,
      apiRootPath,
    },
  })

  let listenOptions

  if (socket) {
    listenOptions = { path: socket }
  } else {
    listenOptions = {
      port,
      host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
    }
  }

  fastify.listen(listenOptions)

  fastify.ready(() => {
    console.log(chalk.italic.dim('Took ' + (Date.now() - tsServer) + ' ms'))

    const on = socket
      ? socket
      : chalk.magenta(`http://localhost:${port}${apiRootPath}`)

    const webServer = chalk.green(`http://localhost:${port}`)
    const apiServer = chalk.magenta(`http://localhost:${port}`)
    console.log(`Web server started on ${webServer}`)
    console.log(`API serving from ${apiServer}`)
    console.log(`API listening on ${on}`)
    const graphqlEnd = chalk.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)

    sendProcessReady()
  })
}

function sendProcessReady() {
  return process.send && process.send('ready')
}

const separator = chalk.hex('#ff845e')(
  '------------------------------------------------------------------'
)

function logExperimentalHeader() {
  console.log(
    [
      separator,
      `🧪 ${chalk.green('Experimental Feature')} 🧪`,
      separator,
      'Using the experimental API server file at api/dist/server.js',
      separator,
    ].join('\n')
  )
}

function logSkippingFastifyWebServer() {
  console.warn('')
  console.warn('⚠️ Skipping Fastify web server ⚠️')
  console.warn('⚠️ Using new RSC server instead ⚠️')
  console.warn('')
}
