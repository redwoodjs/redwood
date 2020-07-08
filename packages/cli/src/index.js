#!/usr/bin/env node
import path from 'path'
import repl from 'repl'

import yargs from 'yargs'
import { getPaths } from '@redwoodjs/internal'
import { config } from 'dotenv-defaults'

config({
  path: path.join(getPaths().base, '.env'),
  encoding: 'utf8',
  defaults: path.join(getPaths().base, '.env.defaults'),
})

const mapDBToContext = (ctx) => {
  const { db } = require(path.join(getPaths().api.lib, 'db'))
  ctx.db = db
}

// eslint-disable-next-line no-unused-expressions
yargs
  .commandDir('./commands')
  .scriptName('rw')
  .example(
    'yarn rw g page home /',
    "\"Create a page component named 'Home' at path '/'\""
  )
  .command(
    '$0',
    'Start the Redwood REPL',
    () => {},
    () => {
      // Transpile on the fly
      require('@babel/register')
      const r = repl.start()
      // Just make the user's db (i.e. Prisma Client) available
      mapDBToContext(r.context)
    }
  )
  .strict().argv
