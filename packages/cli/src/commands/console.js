import fs from 'fs'
import path from 'path'
import repl from 'repl'

import { registerApiSideBabelHook } from '@redwoodjs/internal'

import { getPaths } from '../lib'

export const command = 'console'
export const aliases = ['c']
export const description = 'Launch an interactive Redwood shell (experimental)'

const paths = getPaths()

const loadPrismaClient = (replContext) => {
  const { db } = require(path.join(paths.api.lib, 'db'))
  replContext.db = db
}

const loadUserConfig = (replContext) => {
  try {
    const userConfig = require(paths.api.console)
    Object.assign(replContext, userConfig)
  } catch (e) {
    console.error(`Error loading user console config from ${paths.api.console}`)
    throw e
  }
}

const consoleHistoryFile = path.join(paths.generated.base, 'console_history')
const persistConsoleHistory = (r) => {
  fs.appendFileSync(
    consoleHistoryFile,
    r.lines.filter((line) => line.trim()).join('\n') + '\n',
    'utf8'
  )
}

const loadConsoleHistory = async (r) => {
  try {
    const history = await fs.promises.readFile(consoleHistoryFile, 'utf8')
    history
      .split('\n')
      .reverse()
      .map((line) => r.history.push(line))
  } catch (e) {
    // We can ignore this -- it just means the user doesn't have any history yet
  }
}

export const handler = () => {
  // Transpile on the fly
  registerApiSideBabelHook({
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            src: paths.api.src,
          },
        },
        'rwjs-console-module-resolver',
      ],
    ],
  })

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

  // Persist console history to .redwood/console_history. See
  // https://tjwebb.medium.com/a-custom-node-repl-with-history-is-not-as-hard-as-it-looks-3eb2ca7ec0bd
  loadConsoleHistory(r)
  r.addListener('close', () => persistConsoleHistory(r))

  // Make the project's db (i.e. Prisma Client) available
  loadPrismaClient(r.context)

  // Load the user's custom console configuration
  loadUserConfig(r.context)
}
