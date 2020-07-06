import path from 'path'
import fs from 'fs'

import terminalLink from 'terminal-link'

import { runCommandTask, getPaths } from 'src/lib'
import c from 'src/lib/colors'

export const command = 'studio'
export const description = 'Start Prisma Studio'

export const builder = (yargs) => {
  yargs.epilogue(
    `Also see the ${terminalLink(
      'Redwood CLI Reference',
      'https://redwoodjs.com/reference/command-line-interface#db-studio'
    )}`
  )
}

export const handler = async () => {
  // No database, no migrations, no studio.
  const FILE_DB = path.join(getPaths().api.db, 'dev.db')
  const DIR_MIGRATIONS = path.join(getPaths().api.db, 'migrations')

  if (!fs.existsSync(FILE_DB) && !fs.existsSync(DIR_MIGRATIONS)) {
    console.log(
      // eslint-disable-next-line
      `${c.warning('[warning]')} your app doesn't have a Database (${c.info('api/prisma/dev.db')}) and/or Migrations (${c.info('api/prisma/migrations')}). ${c.green('Save and up')} before starting Studio.`
    )
    return
  }

  await runCommandTask(
    [
      {
        title: 'Starting Prisma Studio...',
        cmd: 'yarn prisma',
        args: ['studio', '--experimental'],
      },
    ],
    { verbose: true }
  )
}
