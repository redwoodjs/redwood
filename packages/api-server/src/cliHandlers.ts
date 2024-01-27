import path from 'path'

import c from 'ansi-colors'

import { redwoodFastifyWeb } from '@redwoodjs/fastify-web'
import { getPaths, getConfig } from '@redwoodjs/project-config'

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
    description: 'Load .env and .env.defaults files',
    type: 'boolean',
    // We have to default to `false` for backwards compatibility.
    default: false,
  },
} as const

export const apiServerHandler = async (options: ApiServerArgs) => {
  const { port, socket, apiRootPath, loadEnvFiles } = options
  const tsApiServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting API Server...\n')))

  if (loadEnvFiles) {
    const { config } = await import('dotenv-defaults')

    config({
      path: path.join(getPaths().base, '.env'),
      defaults: path.join(getPaths().base, '.env.defaults'),
      multiline: true,
    })
  }

  let fastify = createFastifyInstance()

  // Import Server Functions.
  fastify = await withFunctions(fastify, options)

  const http = startFastifyServer({
    port,
    socket,
    fastify,
  }).ready(() => {
    console.log(c.italic(c.dim('Took ' + (Date.now() - tsApiServer) + ' ms')))

    const on = socket
      ? socket
      : c.magenta(`http://localhost:${port}${apiRootPath}`)
    console.log(`API listening on ${on}`)
    const graphqlEnd = c.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)
    sendProcessReady()
  })
  process.on('exit', () => {
    http?.close()
  })
}

export const bothServerHandler = async (options: BothServerArgs) => {
  const { port, socket } = options
  const tsServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting API and Web Servers...\n')))
  const apiRootPath = coerceRootPath(getConfig().web.apiUrl)

  let fastify = createFastifyInstance()

  await fastify.register(redwoodFastifyWeb)
  fastify = await withFunctions(fastify, { ...options, apiRootPath })

  startFastifyServer({
    port,
    socket,
    fastify,
  }).ready(() => {
    console.log(c.italic(c.dim('Took ' + (Date.now() - tsServer) + ' ms')))
    const on = socket
      ? socket
      : c.magenta(`http://localhost:${port}${apiRootPath}`)
    const webServer = c.green(`http://localhost:${port}`)
    const apiServer = c.magenta(`http://localhost:${port}`)
    console.log(`Web server started on ${webServer}`)
    console.log(`API serving from ${apiServer}`)
    console.log(`API listening on ${on}`)
    const graphqlEnd = c.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)
    sendProcessReady()
  })
}

function coerceRootPath(path: string) {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}

// Temporarily here till we refactor server code
export { createServer } from './createServer'
