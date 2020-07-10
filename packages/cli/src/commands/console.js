import path from 'path'
import repl from 'repl'

import { getPaths } from 'src/lib'

/**
 * Console is less technical and more Railsy
 */
export const command = 'console'
/**
 * @todo
 * Appropriate alias?
 */
export const aliases = ['c']

/**
 * @todo
 * Should we make this more console related?
 * I.e. does using the word REPL here contradict our efforts to be less technical?
 */
export const description = 'Start the Redwood REPL'

const mapDBToContext = (ctx) => {
  const { db } = require(path.join(getPaths().api.lib, 'db'))
  ctx.db = db
}

export const handler = () => {
  // Transpile on the fly
  require('@babel/register')
  const r = repl.start()
  // Just make the user's db (i.e. Prisma Client) available
  mapDBToContext(r.context)
}
