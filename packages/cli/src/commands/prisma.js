import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
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
export const builder = async (yargs) => {
  // accept either help or --help, which is the same behavior as all the other RW Yargs commands.
  const argv = mapHelpCommandToFlag(process.argv.slice(3))

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
    if (['db'].includes(argv[0])) {
      // this is safe as is if a user also adds --preview-feature
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
  const args = Array.from(new Set([...argv, ...autoFlags]))

  console.log(
    c.green(`\nRunning Prisma CLI:\n`) + `yarn prisma ${args.join(' ')} \n`
  )

  try {
    const prismaCommand = execa(
      `"${path.join(paths.base, 'node_modules/.bin/prisma')}"`,
      args,
      {
        shell: true,
        cwd: paths.api.base,
        extendEnv: true,
        cleanup: true,
        stdio: 'inherit',
      }
    )
    prismaCommand.stdout?.pipe(process.stdout)
    prismaCommand.stderr?.pipe(process.stderr)

    // So we can check for yarn prisma in the output
    // e.g. yarn prisma introspect
    const { stdout } = await prismaCommand

    if (hasHelpFlag || stdout?.match('yarn prisma')) {
      printRwWrapperInfo()
    }
  } catch (e) {
    process.exit(e?.exitCode || 1)
  }
}

const mapHelpCommandToFlag = (argv) => {
  return argv.some((x) => x.includes('help'))
    ? [
        ...argv.filter((x) => !['--help'].includes(x) && !['help'].includes(x)),
        '--help',
      ]
    : argv
}

const printRwWrapperInfo = () => {
  const message = `
  ${c.bold('🦺 Redwood CLI Tip')}\n
     Use 'redwood prisma' to automatically pass the options
     '--schema=[path]' and '--preview-feature'. For example:\n
     ${c.green('yarn redwood prisma [command]')}\n
  🔍 Redwood Doc: ${c.underline(
    'https://redwoodjs.com/docs/cli-commands#prisma'
  )}
  `
  console.log(
    boxen(message, {
      padding: { top: 0, bottom: 0, right: 1, left: 1 },
      margin: 1,
      borderColor: 'gray',
    })
  )
}
