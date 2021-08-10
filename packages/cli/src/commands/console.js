import path from 'path'
import repl from 'repl'

import { registerApiSideBabelHook } from '@redwoodjs/internal'

import { getPaths } from '../lib'

export const command = 'console'
export const aliases = ['c']
export const description = 'Launch an interactive Redwood shell (experimental)'

const paths = getPaths().api

const mapDBToContext = (ctx) => {
  const { db } = require(path.join(paths.lib, 'db'))
  ctx.db = db
}

export const handler = () => {
  // Transpile on the fly
  registerApiSideBabelHook()

  const r = repl.start()

  // always await promises.
  // source: https://github.com/nodejs/node/issues/13209#issuecomment-619526317
  const defaultEval = r.eval
  r.eval = (cmd, context, filename, callback) => {
    defaultEval(cmd, context, filename, async (err, result) => {
      if (err) {
        // propagate errors.
        callback(err)
      } else {
        // await the promise and either return the result or error.
        try {
          callback(null, await Promise.resolve(result))
        } catch (err) {
          callback(err)
        }
      }
    })
  }

  // Make the project's db (i.e. Prisma Client) available
  mapDBToContext(r.context)
}
