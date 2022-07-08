import c from 'ansi-colors'

import { getConfig } from '@redwoodjs/internal'

import createFastifyInstance from './fastify'
import withApiProxy from './plugins/withApiProxy'
import withFunctions from './plugins/withFunctions'
import withWebServer from './plugins/withWebServer'
import { startServer as startFastifyServer } from './server'
import type { HttpServerParams } from './server'

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
    alias: ['rootPath', 'root-path'],
    default: '/',
    type: 'string',
    desc: 'Root path where your api functions are served',
    coerce: coerceRootPath,
  },
} as const

export const webCliOptions = {
  port: { default: getConfig().web?.port || 8910, type: 'number', alias: 'p' },
  socket: { type: 'string' },
  apiHost: {
    alias: 'api-host',
    type: 'string',
    desc: 'Forward requests from the apiUrl, defined in redwood.toml to this host',
  },
} as const

interface ApiServerArgs extends Omit<HttpServerParams, 'fastify'> {
  apiRootPath: string // either user supplied or '/'
}

export const apiServerHandler = async ({
  port,
  socket,
  apiRootPath,
}: ApiServerArgs) => {
  const tsApiServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting API Server...\n')))

  let fastify = createFastifyInstance()

  // Import Server Functions.
  fastify = await withFunctions(fastify, apiRootPath)

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

export const bothServerHandler = async ({
  port,
  socket,
}: Omit<HttpServerParams, 'fastify'>) => {
  const tsServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting API and Web Servers...\n')))
  const apiRootPath = coerceRootPath(getConfig().web.apiUrl)

  let fastify = createFastifyInstance()

  // Attach plugins
  fastify = await withWebServer(fastify)
  fastify = await withFunctions(fastify, apiRootPath)

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

interface WebServerArgs extends Omit<HttpServerParams, 'fastify'> {
  apiHost?: string
}

export const webServerHandler = async ({
  port,
  socket,
  apiHost,
}: WebServerArgs) => {
  const tsServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting Web Server...\n')))
  const apiUrl = getConfig().web.apiUrl
  // Construct the graphql url from apiUrl by default
  // But if apiGraphQLUrl is specified, use that instead
  const graphqlEndpoint = coerceRootPath(
    getConfig().web.apiGraphQLUrl ?? `${apiUrl}/graphql`
  )

  let fastify = createFastifyInstance()

  // serve static files from "web/dist"
  fastify = await withWebServer(fastify)

  // If apiHost is supplied, it means the functions are running elsewhere
  // So we should just proxy requests
  if (apiHost) {
    // Attach plugin for proxying
    fastify = await withApiProxy(fastify, { apiHost, apiUrl })
  }

  startFastifyServer({
    port: port,
    socket,
    fastify,
  }).ready(() => {
    console.log(c.italic(c.dim('Took ' + (Date.now() - tsServer) + ' ms')))
    if (socket) {
      console.log(`Listening on ` + c.magenta(`${socket}`))
    }
    const webServer = c.green(`http://localhost:${port}`)
    console.log(`Web server started on ${webServer}`)
    console.log(`GraphQL endpoint is set to ` + c.magenta(`${graphqlEndpoint}`))
    sendProcessReady()
  })
}

function coerceRootPath(path: string) {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}
