#!/usr/bin/env node
import yargs from 'yargs'

import { http } from './http'

if (process.argv0 === 'api-server') {
  console.log()
  console.warn(
    '"api-server" is deprecated, please use "rw-api-server" instead.'
  )
  console.log()
}

const { port, socket, rootPath } = yargs
  .option('port', { default: 8911, type: 'number', alias: 'p' })
  .option('socket', { type: 'string' })
  .option('root-path', {
    default: '/',
    type: 'string',
    desc: 'Root path where your api functions are served',
  })
  .coerce('root-path', (path) => {
    // Make sure that we create a root path that start and ending slash (/)
    const prefix = path.charAt(0) !== '/' ? '/' : ''
    const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

    return `${prefix}${path}${suffix}`
  }).argv

http({ port, socket }).on('listening', () => {
  if (socket) {
    console.log(`Listening on ${socket}`)
  } else {
    console.log(`Listening on http://localhost:${port}${rootPath}`)
  }
  console.log()
})

export { rootPath }
