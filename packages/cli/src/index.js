#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

import { config } from 'dotenv-defaults'
import findup from 'findup-sync'
import { hideBin, Parser } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { telemetryMiddleware } from '@redwoodjs/telemetry'

import * as buildCommand from './commands/build'
import * as checkCommand from './commands/check'
import * as consoleCommand from './commands/console'
import * as dataMigrateCommand from './commands/data-migrate'
import * as deployCommand from './commands/deploy'
import * as destroyCommand from './commands/destroy'
import * as devCommand from './commands/dev'
import * as execCommand from './commands/exec'
import * as generateCommand from './commands/generate'
import * as infoCommand from './commands/info'
import * as lintCommand from './commands/lint'
import * as prerenderCommand from './commands/prerender'
import * as prismaCommand from './commands/prisma'
import * as recordCommand from './commands/record'
import * as serveCommand from './commands/serve'
import * as setupCommand from './commands/setup'
import * as storybookCommand from './commands/storybook'
import * as testCommand from './commands/test'
import * as tstojsCommand from './commands/ts-to-js'
import * as typeCheckCommand from './commands/type-check'
import * as upgradeCommand from './commands/upgrade'
import { getPaths } from './lib'

// # Setting the CWD
//
// The current working directory can be set via:
//
// 1. The `--cwd` option
// 2. The `RWJS_CWD` env-var
// 3. By traversing directories upwards for the first `redwood.toml`
//
// ## Examples
//
// ```
// yarn rw info --cwd /path/to/project
// RWJS_CWD=/path/to/project yarn rw info
//
// # In this case, `--cwd` wins out over `RWJS_CWD`
// RWJS_CWD=/path/to/project yarn rw info --cwd /path/to/other/project
//
// # Here we traverses upwards for a redwood.toml.
// cd api
// yarn rw info
// ```

let { cwd, testEnv } = Parser(hideBin(process.argv))
cwd ??= process.env.RWJS_CWD

try {
  if (cwd) {
    // `cwd` was set by the `--cwd` option or the `RWJS_CWD` env var. In this case,
    // we don't want to find up for a `redwood.toml` file. The `redwood.toml` should just be in that directory.

    const redwoodTOMLPath = path.join(cwd, 'redwood.toml')

    if (!fs.existsSync(redwoodTOMLPath)) {
      throw new Error(`Couldn't find a "redwood.toml" file in ${cwd}.`)
    }
  } else {
    // `cwd` wasn't set. Odds are they're in a Redwood project,
    // but they could be in ./api or ./web, so we have to find up to be sure.

    const redwoodTomlPath = findup('redwood.toml', { cwd: process.cwd() })

    if (!redwoodTomlPath) {
      throw new Error(
        `Couldn't find up a "redwood.toml" file from ${process.cwd()}.`
      )
    }

    cwd = path.dirname(redwoodTomlPath)
  }
} catch (error) {
  console.error(
    [error.message, "Are you sure you're in a Redwood project?"].join('\n')
  )
  process.exit(1)
}

process.env.RWJS_CWD = cwd

// # Load .env, .env.defaults
//
// This should be done as early as possible, and the earliest we can do it is after setting `cwd`.

if (testEnv) {
  console.log(
    JSON.stringify({
      name: 'process.env before dotenv-defaults',
      value: process.env,
    })
  )
}

config({
  path: path.join(getPaths().base, '.env'),
  defaults: path.join(getPaths().base, '.env.defaults'),
  multiline: true,
})

if (testEnv) {
  console.log(
    JSON.stringify({
      name: 'process.env after dotenv-defaults',
      value: process.env,
    })
  )
  process.exit()
}

// # Build the CLI and run it

yargs(hideBin(process.argv))
  // Config
  .scriptName('rw')
  .middleware([
    // We've already handled `cwd` above, but it may still be in `argv`.
    // We don't need it anymore so let's get rid of it.
    (argv) => {
      delete argv.cwd
    },
    telemetryMiddleware,
  ])
  .option('cwd', {
    describe: 'Working directory to use (where `redwood.toml` is located)',
  })
  .example(
    'yarn rw g page home /',
    "\"Create a page component named 'Home' at path '/'\""
  )
  .demandCommand()
  .strict()

  // Commands
  .command(buildCommand)
  .command(checkCommand)
  .command(consoleCommand)
  .command(dataMigrateCommand)
  .command(deployCommand)
  .command(destroyCommand)
  .command(devCommand)
  .command(execCommand)
  .command(generateCommand)
  .command(infoCommand)
  .command(lintCommand)
  .command(prerenderCommand)
  .command(prismaCommand)
  .command(recordCommand)
  .command(serveCommand)
  .command(setupCommand)
  .command(storybookCommand)
  .command(testCommand)
  .command(tstojsCommand)
  .command(typeCheckCommand)
  .command(upgradeCommand)

  // Run
  .parse()
