import fs from 'fs'
import path from 'path'

import boxen from 'boxen'
import execa from 'execa'

import { getPaths } from '@redwoodjs/internal'
import { errorTelemetry } from '@redwoodjs/telemetry'

import c from '../lib/colors'

export const command = 'prisma [commands..]'
export const description = 'Run Prisma CLI with experimental features'

/**
 * This is a lightweight wrapper around Prisma's CLI with some Redwood CLI modifications.
 */
export const builder = (yargs) => {
  // Disable yargs parsing of commands and options because it's forwarded
  // to Prisma CLI.
  yargs
    .strictOptions(false)
    .strictCommands(false)
    .strict(false)
    .parserConfiguration({
      'camel-case-expansion': false,
    })
    .help(false)
    .version(false)
}

// eslint-disable-next-line no-unused-vars
export const handler = async ({ _, $0, commands = [], ...options }) => {
  const rwjsPaths = getPaths()

  // Prisma only supports '--help', but Redwood CLI supports `prisma <command> help`
  const helpIndex = commands.indexOf('help')
  if (helpIndex !== -1) {
    options.help = true
    commands.splice(helpIndex, 1)
  }

  // Automatically inject options for some commands.
  const hasHelpOption = options.help || options.h
  if (!hasHelpOption) {
    if (
      ['generate', 'introspect', 'db', 'migrate', 'studio', 'format'].includes(
        commands[0]
      )
    ) {
      if (!fs.existsSync(rwjsPaths.api.dbSchema)) {
        console.error()
        console.error(c.error('No Prisma Schema found.'))
        console.error(`Redwood searched here '${rwjsPaths.api.dbSchema}'`)
        console.error()
        process.exit(1)
      }
      options.schema = `"${rwjsPaths.api.dbSchema}"`

      if (['seed', 'diff'].includes(commands[1])) {
        delete options.schema
      }
    }
  }

  // Convert command and options into a string that's run via execa
  const args = commands
  for (const [name, value] of Object.entries(options)) {
    // Allow both long and short form commands, e.g. --name and -n
    args.push(name.length > 1 ? `--${name}` : `-${name}`)
    if (typeof value !== 'boolean') {
      args.push(value)
    }
  }

  console.log()
  console.log(c.green('Running Prisma CLI...'))
  console.log(c.underline('$ yarn prisma ' + args.join(' ')))
  console.log()

  try {
    execa.sync(
      `"${path.join(rwjsPaths.base, 'node_modules/.bin/prisma')}"`,
      args,
      {
        shell: true,
        cwd: rwjsPaths.base,
        stdio: 'inherit',
        cleanup: true,
      }
    )

    if (hasHelpOption || commands.length === 0) {
      printWrapInfo()
    }
  } catch (e) {
    errorTelemetry(process.argv, `Error generating prisma client: ${e.message}`)
    process.exit(e?.exitCode || 1)
  }
}

const printWrapInfo = () => {
  const message = [
    c.bold('Redwood CLI wraps Prisma CLI'),
    '',
    'Use `yarn rw prisma` to automatically pass `--schema` and `--preview-feature` options.',
    'Use `yarn prisma` to skip Redwood CLI automatic options.',
    '',
    'Find more information in our docs:',
    c.underline('https://redwoodjs.com/docs/cli-commands#prisma'),
  ]

  console.log(
    boxen(message.join('\n'), {
      padding: { top: 0, bottom: 0, right: 1, left: 1 },
      margin: 1,
      borderColor: 'gray',
    })
  )
}
