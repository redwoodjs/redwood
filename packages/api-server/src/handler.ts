import c from 'ansi-colors'

import { getConfig } from '@redwoodjs/internal'

import createApp from './app'
import withApiProxy from './middleware/withApiProxy'
import withFunctions from './middleware/withFunctions'
import withWebServer from './middleware/withWebServer'
import { startServer } from './server'
import type { HttpServerParams } from './server'

/*
 * This file has defines CLI handlers used by the redwood cli, for `rw serve`
 * Also used in index.ts for the api server
 */

export const commonOptions = {
  port: { default: getConfig().web?.port || 8910, type: 'number', alias: 'p' },
  socket: { type: 'string' },
} as const

export const apiCliOptions = {
  port: { default: getConfig().web?.port || 8911, type: 'number', alias: 'p' },
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

interface ApiServerArgs extends Omit<HttpServerParams, 'app'> {
  apiRootPath: string // either user supplied or '/'
}

export const apiServerHandler = async ({
  port,
  socket,
  apiRootPath,
}: ApiServerArgs) => {
  const tsApiServer = Date.now()
  process.stdout.write(c.dim(c.italic('Starting API Server...')))
  const app = createApp()
  const http = startServer({
    port,
    socket,
    app,
  }).on('listening', () => {
    console.log(c.italic(c.dim('Took ' + (Date.now() - tsApiServer) + ' ms')))

    const on = socket
      ? socket
      : c.magenta(`http://localhost:${port}${apiRootPath}`)
    console.log(`Listening on ${on}`)

    // Import Server Functions.
    withFunctions(app, apiRootPath)
  })
  process.on('exit', () => {
    http?.close()
  })
}

export const bothServerHandler = async ({
  port,
  socket,
}: Omit<HttpServerParams, 'app'>) => {
  const apiRootPath = getConfig().web.apiURL
  const apiGraphQLURL = getConfig().web.apiGraphQLURL

  let app = createApp()

  // Attach middleware
  app = await withFunctions(app, apiRootPath)
  app = withWebServer(app)

  startServer({
    port,
    socket,
    app,
  }).on('listening', () => {
    if (socket) {
      console.log(`Listening on ${socket}`)
    }

    console.log(`Web server started on ${port} `)
    console.log(
      `API serving from ${apiRootPath} listening on ${port} with GraphQL endpoint at ${apiGraphQLURL}`
    )
  })
}

interface WebServerArgs extends Omit<HttpServerParams, 'app'> {
  apiHost?: string
}

export const webServerHandler = ({ port, socket, apiHost }: WebServerArgs) => {
  const apiUrl = getConfig().web.apiURL
  const apiGraphQLURL = coerceRootPath(getConfig().web.apiGraphQLURL)

  let app = createApp()

  // Attach middleware
  // We need to proxy api requests to prevent CORS issues
  if (apiHost) {
    app = withApiProxy(app, {
      apiHost,
      apiUrl,
    })
  }

  app = withWebServer(app)

  startServer({
    port: port,
    socket,
    app,
  }).on('listening', () => {
    if (socket) {
      console.log(`Listening on ${socket}`)
    }

    console.log(`Web server started on port ${port} `)
    console.log(`GraphQL endpoint is ${apiUrl}${apiGraphQLURL}`)
  })
}

function coerceRootPath(path: string) {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}
