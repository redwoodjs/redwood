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
  port: { default: 8910, type: 'number', alias: 'p' },
  socket: { type: 'string' },
} as const

export const apiCliOptions = {
  port: { default: 8911, type: 'number', alias: 'p' },
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
  port: { default: 8910, type: 'number', alias: 'p' },
  socket: { type: 'string' },
  apiHost: {
    alias: 'api-host',
    type: 'string',
    desc: 'Forward requests from the apiProxyPath, defined in redwood.toml to this host',
  },
} as const

interface ApiServerArgs extends Omit<HttpServerParams, 'app'> {
  apiRootPath: string // either user supplied or '/'
}

export const apiServerHandler = ({
  port,
  socket,
  apiRootPath,
}: ApiServerArgs) => {
  let app = createApp()

  // Attach middleware
  app = withFunctions(app, apiRootPath)

  startServer({
    port,
    socket,
    app,
  }).on('listening', () => {
    if (socket) {
      console.log(`Listening on ${socket}`)
    }
    console.log(`Listening on http://localhost:${port}${apiRootPath}`)
  })
}

export const bothServerHandler = ({
  port,
  socket,
}: Omit<HttpServerParams, 'app'>) => {
  const apiRootPath = coerceRootPath(getConfig().web.apiProxyPath)
  let app = createApp()

  // Attach middleware
  app = withFunctions(app, apiRootPath)
  app = withWebServer(app)

  startServer({
    port,
    socket,
    app,
  }).on('listening', () => {
    if (socket) {
      console.log(`Listening on ${socket}`)
    }

    console.log(`Web server started on http://localhost:${port} `)
    console.log(`APIs Listening on http://localhost:${port}${apiRootPath}`)
  })
}

interface WebServerArgs extends Omit<HttpServerParams, 'app'> {
  apiHost?: string
}

export const webServerHandler = ({ port, socket, apiHost }: WebServerArgs) => {
  let app = createApp()

  // Attach middleware
  // We need to proxy api requests to prevent CORS issues
  if (apiHost) {
    const apiProxyPath = getConfig().web.apiProxyPath
    app = withApiProxy(app, { apiHost, apiProxyPath })
  }

  app = withWebServer(app)

  startServer({
    port,
    socket,
    app,
  }).on('listening', () => {
    if (socket) {
      console.log(`Listening on ${socket}`)
    }

    console.log(`Web server started on http://localhost:${port} `)
  })
}

function coerceRootPath(path: string) {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}
