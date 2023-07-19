#!/usr/bin/env node

import yargsParser from 'yargs-parser'

import { serve } from './server'

if (require.main === module) {
  const { port, socket, apiHost } = yargsParser(process.argv.slice(2), {
    string: ['port', 'socket', 'apiHost'],
    alias: { apiHost: ['api-host'], port: ['p'] },
  })

  serve({ port, socket, apiHost })
}
