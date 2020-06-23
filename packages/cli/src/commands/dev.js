import fs from 'fs'
import path from 'path'

import concurrently from 'concurrently'
import terminalLink from 'terminal-link'
import { getConfig, shutdownPort } from '@redwoodjs/internal'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'
import { handler as generatePrismaClient } from 'src/commands/dbCommands/generate'

export const command = 'dev [side..]'
export const description = 'Start development servers for api, db, and web'
export const builder = (yargs) => {
  yargs
    .positional('side', {
      choices: ['api', 'web'],
      default: ['api', 'web'],
      description: 'Which dev server(s) to start',
      type: 'array',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#dev'
      )}`
    )
}

export const handler = async ({ side = ['api', 'web'] }) => {
  // We use BASE_DIR when we need to effectively set the working dir
  const BASE_DIR = getPaths().base
  // For validation, e.g. dirExists?, we use these
  // note: getPaths().web|api.base returns undefined on Windows
  const API_DIR_SRC = getPaths().api.src
  const WEB_DIR_SRC = getPaths().web.src

  if (side.includes('api')) {
    try {
      // This command will check if the api side has a `prisma.schema` file.
      await generatePrismaClient({ verbose: false, force: false })
    } catch (e) {
      console.error(c.error(e.message))
    }

    try {
      await shutdownPort(getConfig().api.port)
    } catch (e) {
      console.error(
        `Error whilst shutting down "api" port: ${c.error(e.message)}`
      )
    }
  }

  if (side.includes('web')) {
    try {
      await shutdownPort(getConfig().web.port)
    } catch (e) {
      console.error(
        `Error whilst shutting down "web" port: ${c.error(e.message)}`
      )
    }
  }

  const jobs = {
    api: {
      name: 'api',
      command: `cd "${path.join(BASE_DIR, 'api')}" && yarn dev-server`,
      prefixColor: 'cyan',
      runWhen: () => fs.existsSync(API_DIR_SRC),
    },
    web: {
      name: 'web',
      command: `cd "${path.join(
        BASE_DIR,
        'web'
      )}" && yarn webpack-dev-server --config ../node_modules/@redwoodjs/core/config/webpack.development.js`,
      prefixColor: 'blue',
      runWhen: () => fs.existsSync(WEB_DIR_SRC),
    },
  }

  concurrently(
    Object.keys(jobs)
      .map((n) => side.includes(n) && jobs[n])
      .filter((job) => job && job.runWhen()),
    {
      prefix: '{name} |',
      timestampFormat: 'HH:mm:ss',
    }
  ).catch((e) => {
    if (typeof e?.message !== 'undefined') {
      console.log(c.error(e.message))
    }
  })
}
