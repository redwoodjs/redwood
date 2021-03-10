#!/usr/bin/env node
import yargs from 'yargs'

import { http } from './http'

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
