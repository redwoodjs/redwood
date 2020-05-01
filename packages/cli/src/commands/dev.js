import fs from 'fs'
import path from 'path'

import concurrently from 'concurrently'

import { getPaths } from 'src/lib'
import c from 'src/lib/colors'
import { handler as generatePrismaClient } from 'src/commands/dbCommands/generate'

export const command = 'dev [app..]'
export const desc = 'Run development servers.'
export const builder = {
  app: { choices: ['db', 'api', 'web'], default: ['db', 'api', 'web'] },
}

export const handler = async ({ app = ['db', 'api', 'web'] }) => {
  // For Windows: Replaces ` ` with `\ `. Damn, there has got to be a better
  // way to sanitize paths?!
  const BASE_DIR = getPaths().base.replace(' ', '\\ ')
  const API_DIR = path.join(BASE_DIR, 'api')
  const WEB_DIR = path.join(BASE_DIR, 'web')

  // Generate the Prisma client if it doesn't exist.
  await generatePrismaClient({ verbose: false, force: false })

  const jobs = {
    api: {
      name: 'api',
      command: `cd ${API_DIR} && yarn dev-server`,
      prefixColor: 'cyan',
      runWhen: () => fs.existsSync(API_DIR),
    },
    db: {
      name: ' db', // prefixed with ` ` to match output indentation.
      command: `cd ${path.join(
        BASE_DIR,
        'api'
      )} && yarn prisma generate --watch`,
      prefixColor: 'magenta',
      runWhen: () => fs.existsSync(API_DIR),
    },
    web: {
      name: 'web',
      command: `cd ${path.join(
        BASE_DIR,
        'web'
      )} && yarn webpack-dev-server --config ../node_modules/@redwoodjs/core/config/webpack.development.js`,
      prefixColor: 'blue',
      runWhen: () => fs.existsSync(WEB_DIR),
    },
  }

  concurrently(
    Object.keys(jobs)
      .map((n) => app.includes(n) && jobs[n])
      .filter((job) => job && job.runWhen()),
    {
      restartTries: 3,
      prefix: '{time} {name} |',
      timestampFormat: 'HH:mm:ss',
    }
  ).catch((e) => {
    console.log(c.error(e.message))
  })
}
