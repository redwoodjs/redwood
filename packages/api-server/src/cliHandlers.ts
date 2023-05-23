import c from 'ansi-colors'

import { getConfig } from '@redwoodjs/project-config'

import createFastifyInstance from './fastify'
import withApiProxy from './plugins/withApiProxy'
import withFunctions from './plugins/withFunctions'
import withWebServer from './plugins/withWebServer'
import { startServer as startFastifyServer } from './server'
import { BothServerArgs, WebServerArgs, ApiServerArgs } from './types'

/*
 * This file has defines CLI handlers used by the redwood cli, for `rw serve`
 * Also used in index.ts for the api server
 */

const sendProcessReady = () => {
  return process.send && process.send('ready')
}

const redwoodProjectConfig = getConfig()

export const commonOptions = {
  port: {
    default: redwoodProjectConfig.web.port ?? 8910,
    type: 'number',
    alias: 'p',
  },
  host: {
    default: redwoodProjectConfig.web.host ?? 'localhost',
    type: 'string',
    alias: 'h',
  },
  socket: { type: 'string' },
} as const

export const apiCliOptions = {
  port: {
    default: redwoodProjectConfig.api?.port ?? 8911,
    type: 'number',
    alias: 'p',
  },
  host: {
    default: redwoodProjectConfig.api.host ?? 'localhost',
    type: 'string',
    alias: 'h',
  },
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
  port: {
    default: redwoodProjectConfig.web.port ?? 8910,
    type: 'number',
    alias: 'p',
  },
  host: {
    default: redwoodProjectConfig.web.host ?? 'localhost',
    type: 'string',
    alias: 'h',
  },
  socket: { type: 'string' },
  apiHost: {
    alias: 'api-host',
    type: 'string',
    desc: 'Forward requests from the apiUrl, defined in redwood.toml to this host',
  },
} as const

export const apiServerHandler = async (options: ApiServerArgs) => {
  const { port, host, socket, apiRootPath } = options
  const tsApiServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting API Server...\n')))

  let fastify = createFastifyInstance()

  // Import Server Functions.
  fastify = await withFunctions(fastify, options)

  const http = startFastifyServer({
    port,
    host,
    socket,
    fastify,
  }).ready(() => {
    console.log(c.italic(c.dim('Took ' + (Date.now() - tsApiServer) + ' ms')))

    const on = socket
      ? socket
      : c.magenta(`http://${host}:${port}${apiRootPath}`)
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
  const redwoodProjectConfig = getConfig()
  const { port, host, socket } = options
  const tsServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting API and Web Servers...\n')))
  const apiRootPath = coerceRootPath(redwoodProjectConfig.web.apiUrl)

  let fastify = createFastifyInstance()

  // Attach plugins
  fastify = await withWebServer(fastify, options)
  fastify = await withFunctions(fastify, { ...options, apiRootPath })

  startFastifyServer({
    port,
    host,
    socket,
    fastify,
  }).ready(() => {
    console.log(c.italic(c.dim('Took ' + (Date.now() - tsServer) + ' ms')))
    const on = socket
      ? socket
      : c.magenta(`http://${host}:${port}${apiRootPath}`)
    const webServer = c.green(`http://${host}:${port}`)
    const apiServer = c.magenta(`http://${host}:${port}`)
    console.log(`Web server started on ${webServer}`)
    console.log(`API serving from ${apiServer}`)
    console.log(`API listening on ${on}`)
    const graphqlEnd = c.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)
    sendProcessReady()
  })
}

export const webServerHandler = async (options: WebServerArgs) => {
  const redwoodProjectConfig = getConfig()
  const { port, host, socket, apiHost } = options
  const tsServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting Web Server...\n')))
  const apiUrl = redwoodProjectConfig.web.apiUrl
  // Construct the graphql url from apiUrl by default
  // But if apiGraphQLUrl is specified, use that instead
  const graphqlEndpoint = coerceRootPath(
    redwoodProjectConfig.web.apiGraphQLUrl ?? `${apiUrl}/graphql`
  )

  let fastify = createFastifyInstance()

  // serve static files from "web/dist"
  fastify = await withWebServer(fastify, options)

  // If apiHost is supplied, it means the functions are running elsewhere
  // So we should just proxy requests
  if (apiHost) {
    // Attach plugin for proxying
    fastify = await withApiProxy(fastify, { apiHost, apiUrl })
  }

  startFastifyServer({
    port: port,
    host,
    socket,
    fastify,
  }).ready(() => {
    console.log(c.italic(c.dim('Took ' + (Date.now() - tsServer) + ' ms')))
    if (socket) {
      console.log(`Listening on ` + c.magenta(`${socket}`))
    }
    const webServer = c.green(`http://${host}:${port}`)
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
