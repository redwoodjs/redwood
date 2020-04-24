import path from 'path'
import { spawnSync } from 'child_process'

import concurrently from 'concurrently'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'
import { handler as generatePrismaClient } from 'src/commands/dbCommands/generate'

export const command = 'dev [app..]'
export const desc = 'Run development servers.'
export const builder = {
  app: {
    choices: ['db', 'api', 'web', 'ide'],
    default: ['db', 'api', 'web', 'ide'],
  },
}

export const handler = async ({ app = ['db', 'api', 'web', 'ide'] }) => {
  // For Windows: Replaces ` ` with `\ `. Damn, there has got to be a better
  // way to sanitize paths?!
  const BASE_DIR = getPaths().base.replace(' ', '\\ ')

  // Generate the Prisma client if it doesn't exist.
  await generatePrismaClient({ verbose: false, force: false })

  const jobs = {
    api: {
      name: 'api',
      command: `cd ${path.join(BASE_DIR, 'api')} && yarn dev-server`,
      prefixColor: 'cyan',
    },
    db: {
      name: ' db', // prefixed with ` ` to match output indentation.
      command: `cd ${path.join(
        BASE_DIR,
        'api'
      )} && yarn prisma generate --watch`,
      prefixColor: 'magenta',
    },
    web: {
      name: 'web',
      command: `cd ${path.join(
        BASE_DIR,
        'web'
      )} && yarn webpack-dev-server --config ../node_modules/@redwoodjs/core/config/webpack.development.js`,
      prefixColor: 'blue',
    },
    ide: {
      name: 'ide',
      command: `cd ${path.join(
        BASE_DIR,
        'api'
      )} && yarn prisma studio --port=8912 --experimental`,
      prefixColor: 'green',
    },
  }

  const shouldRun = (n) => {
    if (n.name == 'ide') {
      const grep = spawnSync('grep', [
        'UserExample',
        'api/prisma/schema.prisma',
      ])
      return !grep.stdout.toString().includes('UserExample')
    } else {
      return true
    }
  }

  concurrently(
    Object.keys(jobs)
      .map((n) => app.includes(n) && jobs[n])
      .filter(shouldRun),
    {
      restartTries: 3,
      prefix: '{time} {name} |',
      timestampFormat: 'HH:mm:ss',
    }
  ).catch((e) => {
    console.log(c.error(e.message))
  })
}
