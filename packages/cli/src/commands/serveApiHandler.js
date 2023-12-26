import path from 'path'

import chalk from 'chalk'
import execa from 'execa'

import { createFastifyInstance, redwoodFastifyAPI } from '@redwoodjs/fastify'
import { getPaths } from '@redwoodjs/project-config'

export const apiExperimentalServerFileHandler = async () => {
  logExperimentalHeader()

  await execa('yarn', ['node', path.join('dist', 'server.js')], {
    cwd: getPaths().api.base,
    stdio: 'inherit',
    shell: true,
  })
  return
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
