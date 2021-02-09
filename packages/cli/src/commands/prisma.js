import fs from 'fs'
import path from 'path'

import execa from 'execa'

import { getPaths } from '@redwoodjs/internal'

import c from 'src/lib/colors'

export const command = 'prisma [commands..]'
export const description = 'Run Prisma CLI with experimental features'

/**
 * This is a lightweight wrapper around Prisma's CLI.
 *
 * In order to test this command you can do the following:
 * 0. cd __fixtures__/example-todo-main && yarn install
 * 1. cd..; yarn build:watch
 * 2. cd packages/cli
 * 3. __REDWOOD__CONFIG_PATH=../../__fixtures__/example-todo-main yarn node dist/index.js prisma <test commands>
 */
export const builder = (yargs) => {
  const argv = process.argv.slice(3)

  // We dynamically create the `--options` that are passed to this command.
  // TODO: Figure out if there's a way to turn off yargs parsing.
  const options = argv
    .filter((x) => x.startsWith('--'))
    .map((x) => x.substr(2))
    .reduce((pv, cv) => {
      return {
        ...pv,
        [cv]: {},
      }
    }, {})
  yargs.help(false).option(options)

  const paths = getPaths()

  let autoFlags = []
  if (['migrate', 'db'].includes(argv[0])) {
    // this is safe as is if a user also adds --preview-feature
    // TO DO might be nice to message user in case of ^^
    autoFlags.push('--preview-feature')
  }

  if (['generate', 'introspect', 'db', 'migrate', 'studio'].includes(argv[0])) {
    if (!fs.existsSync(paths.api.dbSchema)) {
      console.error(c.error('\n Cannot run command. No Prisma Schema found.\n'))
      process.exit(1)
    }
    autoFlags.push('--schema', `"${paths.api.dbSchema}"`)
  }

  execa(
    path.join(paths.base, 'node_modules/.bin/prisma'),
    [...argv.filter((x) => ['--help'].includes(x)), ...autoFlags],
    {
      shell: true,
      stdio: 'inherit',
      cwd: paths.api.base,
      extendEnv: true,
      cleanup: true,
    }
  )
}
