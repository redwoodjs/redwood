import c from 'ansi-colors'

import { redwoodFastifyWeb, coerceRootPath } from '@redwoodjs/fastify-web'
import { getConfig } from '@redwoodjs/project-config'

import createFastifyInstance from './fastify'
import withFunctions from './plugins/withFunctions'
import { startServer as startFastifyServer } from './server'
import type { BothServerArgs, ApiServerArgs } from './types'

/*
 * This file has defines CLI handlers used by the redwood cli, for `rw serve`
 * Also used in index.ts for the api server
 */

const sendProcessReady = () => {
  return process.send && process.send('ready')
}

export const commonOptions = {
  port: { default: getConfig().web?.port || 8910, type: 'number', alias: 'p' },
  socket: { type: 'string' },
} as const

export const apiCliOptions = {
  port: { default: getConfig().api?.port || 8911, type: 'number', alias: 'p' },
  socket: { type: 'string' },
  apiRootPath: {
    alias: ['api-root-path', 'rootPath', 'root-path'],
    default: '/',
    type: 'string',
    desc: 'Root path where your api functions are served',
    coerce: coerceRootPath,
  },
  loadEnvFiles: {
    description:
      'Deprecated; env files are always loaded. This flag is a no-op',
    type: 'boolean',
    hidden: true,
  },
} as const

export const apiServerHandler = async (options: ApiServerArgs) => {
  const { port, socket, apiRootPath } = options
  const tsApiServer = Date.now()
  process.stdout.write(c.dim.italic('Starting API Server...\n'))

  let fastify = createFastifyInstance()

  // Import Server Functions.
  fastify = await withFunctions(fastify, options)

  fastify = await startFastifyServer({ port, socket, fastify })

  fastify.ready(() => {
    console.log(c.dim.italic('Took ' + (Date.now() - tsApiServer) + ' ms'))

    const apiServer = c.magenta(`${fastify.listeningOrigin}${apiRootPath}`)
    const graphqlEndpoint = c.magenta(`${apiServer}graphql`)

    console.log(`API server listening at ${apiServer}`)
    console.log(`GraphQL endpoint at ${graphqlEndpoint}`)

    sendProcessReady()
  })
  process.on('exit', () => {
    fastify?.close()
  })
}

export const bothServerHandler = async (options: BothServerArgs) => {
  const { port, socket } = options
  const tsServer = Date.now()
  process.stdout.write(c.dim.italic('Starting API and Web Servers...\n'))
  const apiRootPath = coerceRootPath(getConfig().web.apiUrl)

  let fastify = createFastifyInstance()

  await fastify.register(redwoodFastifyWeb)
  fastify = await withFunctions(fastify, { ...options, apiRootPath })

  fastify = await startFastifyServer({ port, socket, fastify })

  fastify.ready(() => {
    console.log(c.dim.italic('Took ' + (Date.now() - tsServer) + ' ms'))

    const webServer = c.green(fastify.listeningOrigin)
    const apiServer = c.magenta(`${fastify.listeningOrigin}${apiRootPath}`)
    const graphqlEndpoint = c.magenta(`${apiServer}graphql`)

    console.log(`Web server listening at ${webServer}`)
    console.log(`API server listening at ${apiServer}`)
    console.log(`GraphQL endpoint at ${graphqlEndpoint}`)

    sendProcessReady()
  })
}

// Temporarily here till we refactor server code
export { createServer } from './createServer'
