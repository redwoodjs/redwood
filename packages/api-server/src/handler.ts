import { getConfig } from '@redwoodjs/internal'

import { http } from './http'
import type { HttpServerParams } from './http'

const coerceRootPath = (path: string) => {
  // Make sure that we create a root path that starts and ends with a slash (/)
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}

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
  apiHost: {
    alias: 'api-host',
    type: 'string',
    desc:
      'Forward requests from the apiProxyPath, defined in redwood.toml to this host',
  },
  socket: { type: 'string' },
} as const

export const bothCliOptions = webCliOptions

const runHttpServer = (params: HttpServerParams) => {
  const { socket, port, apiRootPath, apiHost, serveWeb } = params
  return http(params).on('listening', () => {
    if (params.socket) {
      console.log(`Listening on ${socket}`)
    } else {
      if (serveWeb) {
        console.log(`Web server started on http://localhost:${port} `)
      }

      if (!apiHost) {
        console.log(`APIs Listening on http://localhost:${port}${apiRootPath}`)
      }
    }
    console.log()
  })
}

export const apiServerHandler = (
  params: Omit<HttpServerParams, 'apiProxyPath'>
) => {
  return runHttpServer(params)
}

export const bothServerHandler = ({
  port,
  socket,
}: Pick<HttpServerParams, 'port' | 'socket'>) => {
  const rootPath = coerceRootPath(getConfig().web.apiProxyPath)
  runHttpServer({
    port,
    socket,
    apiRootPath: rootPath,
    serveWeb: true,
  })
}

export const webServerHandler = ({
  port,
  socket,
  apiHost,
}: Omit<HttpServerParams, 'rootPath'>) => {
  const apiRootPath = getConfig().web.apiProxyPath
  runHttpServer({
    port,
    socket,
    apiRootPath,
    apiHost,
    serveWeb: true,
  })
}
