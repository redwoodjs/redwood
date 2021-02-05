import fs from 'fs'

import execa from 'execa'
import terminalLink from 'terminal-link'

import { getPaths } from '@redwoodjs/internal'

import c from 'src/lib/colors'

export const command = 'prisma [...commands]'
export const description = 'Run Prisma CLI with experimental features'

export const builder = (yargs) => {
  const argv = process.argv.slice(3)
  const paths = getPaths()

  // descriptions below generate list when `rw prisma --help` is run
  yargs
    .example("'yarn rw prisma migrate dev'", 'No additional options required')
    .positional('db push', {
      alias: 'push',
      description:
        'Push the state from your Prisma schema to your database without creating a migration',
    })
    .positional('db seed', {
      description: "Seed your database. Requires a 'seed.js' file",
    })
    .positional('migrate dev', {
      description:
        'Create a migration from schema.prisma; apply it to the dev database',
    })
    .positional('migrate reset', {
      description:
        'Reset your database and apply all migrations, all data will be lost',
    })
    .positional('migrate resolve', {
      description:
        'Resolve issues with database migrations in deployment databases',
    })
    .positional('migrate status', {
      description: 'Check the status of your database migrations',
    })
    .positional('studio', {
      description: 'Browse your data with Prisma Studio',
    })
    .epilogue(
      `For more commands, options, and examples, see ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#prisma'
      )}`
    )

  let autoFlags = []
  if (['migrate', 'db'].includes(argv[0])) {
    autoFlags.push('--preview-feature')
  }
  if (['generate', 'introspect', 'db', 'migrate', 'studio'].includes(argv[0])) {
    autoFlags.push('--schema', paths.api.dbSchema)

    if (!fs.existsSync(paths.api.dbSchema)) {
      console.log(c.error('\n Cannot run command. No Prisma Schema found.\n'))
      process.exit(1)
    }
  }

  execa('yarn prisma', [...argv, ...autoFlags], {
    shell: true,
    stdio: 'inherit',
    cwd: paths.api.base,
    extendEnv: true,
    cleanup: true,
  })
}
