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

const { port, socket } = yargs
  .option('port', { default: 8911, type: 'number', alias: 'p' })
  .option('socket', { type: 'string' }).argv

http({ port, socket }).on('listening', () => {
  if (socket) {
    console.log(`Listening on ${socket}`)
  } else {
    console.log(`Listening on http://localhost:${port}`)
  }
  console.log()
})
