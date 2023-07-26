import chalk from 'chalk'

import { redwoodFastifyAPI } from '@redwoodjs/fastify-functions'
import { createFastifyInstance } from '@redwoodjs/fastify-shared'

import { Options } from './types'

// TODO: Centralize this somewhere
const sendProcessReady = () => {
  return process.send && process.send('ready')
}

export async function handler(options: Options) {
  const startTime = Date.now()

  const { port, socket, apiRootPath } = options

  console.log(chalk.dim.italic('Starting API Server...'))

  const fastify = createFastifyInstance()

  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      ...options,
    },
  })

  let listenOptions:
    | { path: string; port?: never; host?: never }
    | { path?: never; port?: number; host?: string }

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
    console.log(chalk.italic.dim('Took ' + (Date.now() - startTime) + ' ms'))

    const on = socket
      ? socket
      : chalk.magenta(`http://localhost:${port}${apiRootPath}`)

    console.log(`API listening on ${on}`)

    // FIXME: This isn't always true? The getConfig().web.apiGraphQLUrl option has an affect here?
    const graphqlEnd = chalk.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)

    sendProcessReady()
  })
}
