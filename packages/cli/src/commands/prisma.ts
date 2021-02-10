import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import execa from 'execa'
import { Argv } from 'yargs'

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
export const builder = async (yargs: Argv) => {
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

  yargs
    .help(false)
    .version(false)
    .option(options)
    .option('version', { alias: 'v' })

  const paths = getPaths()

  const autoFlags = []

  const hasHelpFlag = argv.some(
    (arg) => arg.includes('--help') || arg.includes('-h')
  )

  // Only pass auto flags, when not running help
  if (!hasHelpFlag) {
    if (['migrate', 'db'].includes(argv[0])) {
      // this is safe as is if a user also adds --preview-feature
      // @TODO might be nice to message user in case of ^^
      autoFlags.push('--preview-feature')
    }

    if (
      ['generate', 'introspect', 'db', 'migrate', 'studio'].includes(argv[0])
    ) {
      if (!fs.existsSync(paths.api.dbSchema)) {
        console.error(
          c.error('\n Cannot run command. No Prisma Schema found.\n')
        )
        process.exit(1)
      }
      autoFlags.push('--schema', `"${paths.api.dbSchema}"`)
    }
  }

  // Set prevents duplicate flags
  // accept either help or --help, which is the same behavior as all the other RW Yargs commands.
  const argsSet = new Set(
    argv.some((x) => x.includes('help'))
      ? [
          ...argv.filter(
            (x) => !['--help'].includes(x) && !['help'].includes(x)
          ),
          '--help',
        ]
      : [...argv, ...autoFlags]
  )

  const args = Array.from(argsSet)

  console.log(
    c.green(`Running prisma cli: \n`) +
      c.info(`yarn prisma ${args.join(' ')} \n`)
  )

  try {
    const { stdout } = await execa(
      `"${path.join(paths.base, 'node_modules/.bin/prisma')}"`,
      args,
      {
        shell: true,
        stdio: 'pipe',
        cwd: paths.api.base,
        extendEnv: true,
        cleanup: true,
        // Maintain colour formatting
        env: {
          FORCE_COLOR: '1',
        },
      }
    )

    // Show prisma cli output
    console.log(stdout)

    if (hasHelpFlag || stdout.match('yarn prisma')) {
      printRwWrapperInfo()
    }
  } catch (e) {
    // Prisma cli shows help on error
    printRwWrapperInfo()
    process.exit(1)
  }
}

const printRwWrapperInfo = () => {
  const message = `
  Using the Redwood cli: ${c.underline.blue('yarn rw prisma {command}')}
  will pass your project's configuration flags automatically,
  `
  console.log(
    boxen(`${c.bold('::: Redwood Tip :::')} ${message}`, {
      borderColor: 'red',
      dimBorder: true,
    })
  )
}
