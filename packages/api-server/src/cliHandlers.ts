import c from 'ansi-colors'

import {
  createFastifyInstance,
  redwoodFastifyAPI,
  redwoodFastifyWeb,
} from '@redwoodjs/fastify'
import { withApiProxy } from '@redwoodjs/fastify/dist/plugins/withApiProxy'
import { getConfig } from '@redwoodjs/project-config'

// import createFastifyInstance from './fastify'
// import withApiProxy from './plugins/withApiProxy'
// import withFunctions from './plugins/withFunctions'
// import withWebServer from './plugins/withWebServer'
// import { startServer as startFastifyServer } from './server'
import { BothServerArgs, WebServerArgs, ApiServerArgs } from './types'

/*
 * This file has defines CLI handlers used by the redwood cli, for `rw serve`
 * Also used in index.ts for the api server
 */

const sendProcessReady = () => {
  return process.send && process.send('ready')
}

function coerceRootPath(path: string) {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
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

/**
 * TODO:
 *  Check if the server.ts file exists, if so simply execute it with node
 */
/**
 * TODO:
 *  Consider if we should do also do the same for the web side given upcoming streaming support
 */

/**
 * NOTE:
 *  All of the following code would eventually move into a server.ts file in the users project.
 *  This means custom server configuration would be done in the server.ts file and does not need to be supported here.
 */

export const apiServerHandler = async (options: ApiServerArgs) => {
  const { port, socket, apiRootPath } = options
  const tsApiServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting API Server...\n')))

  const fastify = createFastifyInstance()

  process.on('exit', () => {
    fastify?.close()
  })

  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      apiRootPath,
    },
  })

  fastify.listen({
    port: socket ? parseInt(socket) : port,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
  })

  fastify.ready(() => {
    fastify.log.debug(
      { custom: { ...fastify.initialConfig } },
      'Fastify server configuration'
    )
    fastify.log.debug(`Registered plugins \n${fastify.printPlugins()}`)
    console.log(c.italic(c.dim('Took ' + (Date.now() - tsApiServer) + ' ms')))
    const on = socket
      ? socket
      : c.magenta(`http://localhost:${port}${apiRootPath}`)
    console.log(`API listening on ${on}`)
    const graphqlEnd = c.magenta(`${apiRootPath}graphql`)
    console.log(`GraphQL endpoint at ${graphqlEnd}`)
    sendProcessReady()
  })
}

export const webServerHandler = async (options: WebServerArgs) => {
  const { port, socket, apiHost } = options
  const tsServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting Web Server...\n')))
  const apiUrl = getConfig().web.apiUrl
  // Construct the graphql url from apiUrl by default
  // But if apiGraphQLUrl is specified, use that instead
  const graphqlEndpoint = coerceRootPath(
    getConfig().web.apiGraphQLUrl ?? `${apiUrl}/graphql`
  )

  const fastify = createFastifyInstance()

  process.on('exit', () => {
    fastify?.close()
  })

  // serve static files from "web/dist"
  await fastify.register(redwoodFastifyWeb, {
    redwood: {
      apiHost,
    },
  })

  // If apiHost is supplied, it means the functions are running elsewhere
  // So we should just proxy requests
  if (apiHost) {
    // Attach plugin for proxying
    fastify.register(withApiProxy, { apiHost, apiUrl })
  }

  fastify.listen({
    port: socket ? parseInt(socket) : port,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
  })

  fastify.ready(() => {
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

export const bothServerHandler = async (options: BothServerArgs) => {
  const { port, socket } = options
  const tsServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting API and Web Servers...\n')))
  const apiRootPath = coerceRootPath(getConfig().web.apiUrl)

  const fastify = createFastifyInstance()

  process.on('exit', () => {
    fastify?.close()
  })

  await fastify.register(redwoodFastifyWeb, {
    redwood: {
      // apiHost,
    },
  })

  await fastify.register(redwoodFastifyAPI, {
    redwood: {
      ...options,
      apiRootPath,
    },
  })

  fastify.listen({
    port: socket ? parseInt(socket) : port,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '::',
  })

  fastify.ready(() => {
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
