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

const { port, socket, routePrefix } = yargs
  .option('port', { default: 8911, type: 'number', alias: 'p' })
  .option('socket', { type: 'string' })
  .option('routePrefix', {
    default: '/',
    type: 'string',
    desc: 'Route prefix where your Serverless Functions are served',
  }).argv

http({ port, socket }).on('listening', () => {
  if (socket) {
    console.log(`Listening on ${socket}`)
  } else {
    console.log(`Listening on http://localhost:${port}`)
  }
  console.log()
})

export { routePrefix }
