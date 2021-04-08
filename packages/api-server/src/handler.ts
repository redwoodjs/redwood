import { http } from './http'
import type { HttpServerParams } from './http'

export const cliOptions = {
  port: { default: 8911, type: 'number', alias: 'p' },
  socket: { type: 'string' },
  rootPath: {
    alias: 'root-path',
    default: '/',
    type: 'string',
    desc: 'Root path where your api functions are served',
    coerce: (path: string) => {
      // Make sure that we create a root path that starts and ends with a slash (/)
      const prefix = path.charAt(0) !== '/' ? '/' : ''
      const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

      return `${prefix}${path}${suffix}`
    },
  },
} as const

export const handler = ({ port, socket, rootPath }: HttpServerParams) => {
  http({ port, socket, rootPath }).on('listening', () => {
    if (socket) {
      console.log(`Listening on ${socket}`)
    } else {
      console.log(`Listening on http://localhost:${port}${rootPath}`)
    }
    console.log()
  })
}
