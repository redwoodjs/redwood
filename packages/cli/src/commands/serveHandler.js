import path from 'path'

import chalk from 'chalk'
import concurrently from 'concurrently'
import execa from 'execa'

import {
  coerceRootPath,
  createFastifyInstance,
  redwoodFastifyAPI,
  redwoodFastifyWeb,
} from '@redwoodjs/fastify'
import { getConfig, getPaths } from '@redwoodjs/project-config'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { exitWithError } from '../lib/exit'

export const bothServerFileHandler = async (options) => {
  const apiHost = `http://0.0.0.0:${options.apiPort}`

  const { result } = concurrently(
    [
      {
        name: 'api',
        command: `yarn node ${path.join('dist', 'server.js')} --port ${
          options.apiPort
        }`,
        cwd: getPaths().api.base,
        prefixColor: 'cyan',
      },
      {
        name: 'web',
        command: `yarn rw-web-server --port ${options.webPort} --api-host ${apiHost}`,
        cwd: getPaths().base,
        prefixColor: 'blue',
      },
    ],
    {
      prefix: '{name} |',
      timestampFormat: 'HH:mm:ss',
      handleInput: true,
    }
  )

  try {
    await result
  } catch (error) {
    if (typeof error?.message !== 'undefined') {
      errorTelemetry(
        process.argv,
        `Error concurrently starting sides: ${error.message}`
      )
      exitWithError(error)
    }
  }
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

export const apiServerFileHandler = async (options) => {
  await execa(
    'yarn',
    [
      'node',
      path.join('dist', 'server.js'),
      '--port',
      options.port,
      '--apiRootPath',
      options.apiRootPath,
    ],
    {
      cwd: getPaths().api.base,
      stdio: 'inherit',
    }
  )
}

export const apiServerHandler = async (options) => {
  const { port, socket, apiRootPath } = options
  const tsApiServer = Date.now()

  console.log(chalk.dim.italic('Starting API Server...'))

  const fastify = createFastifyInstance()

  process.on('exit', () => {
    fastify?.close()
  })

  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      ...options,
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
    fastify.log.trace(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.trace(`Registered plugins \n${fastify.printPlugins()}`)
    console.log(chalk.italic.dim('Took ' + (Date.now() - tsApiServer) + ' ms'))

    const on = socket
      ? socket
      : chalk.magenta(`http://localhost:${port}${apiRootPath}`)

    console.log(`API listening on ${on}`)
    const graphqlEnd = chalk.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)

    sendProcessReady()
  })
}

export const webServerHandler = async (options) => {
  try {
    await execa(
      'yarn',
      [
        'rw-web-server',
        '--port',
        options.port,
        '--socket',
        options.socket,
        '--api-host',
        options.apiHost,
      ],
      {
        cwd: getPaths().base,
        stdio: 'inherit',
      }
    )
  } catch (e) {
    // `@redwoodjs/web-server` uses a custom error exit code to tell this handler that an error has already been handled.
    // While any other exit code than `0` is considered an error, there seems to be some conventions around some of them
    // like `127`, etc. We chose 64 because it's in the range where there deliberately aren't any previous conventions.
    // See https://tldp.org/LDP/abs/html/exitcodes.html.
    if (e.exitCode === 64) {
      process.exitCode = 1
      return
    }

    exitWithError(e)
  }
}
