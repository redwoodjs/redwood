#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

import { config } from 'dotenv-defaults'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { getPaths, getConfigPath } from '@redwoodjs/internal'
import { telemetryMiddleware } from '@redwoodjs/telemetry'

import colors from './lib/colors'

yargs(hideBin(process.argv))
  .scriptName('rw')
  .middleware([
    getCwdMiddleware,
    getRedwoodProjectMiddleware,
    getColorsMiddleware,
    loadDotEnvDefaultsMiddleware,
    telemetryMiddleware,
  ])
  .option('cwd', {
    describe: 'Working directory to use (where `redwood.toml` is located.)',
  })
  .commandDir('./commands')
  .example(
    'yarn rw g page home /',
    "\"Create a page component named 'Home' at path '/'\""
  )
  .demandCommand()
  .strict()
  .parse()

/**
 * The current working directory can be set via:
 *
 * 1. the `cwd` option
 * 2. the `RWJS_CWD` env var
 * 3. found by traversing directories upwards for the first `redwood.toml`
 *
 * This middleware parses, validates, and sets the current working directory
 * in the order above.
 */
function getCwdMiddleware(argv) {
  let configPath

  try {
    let cwd

    if (argv.cwd) {
      cwd = argv.cwd
      // We delete the property because it's not actually referenced in the CLI—
      // (we use the `RWJS_CWD` env-var)—
      // and it conflicts with "forwarding" commands such as test and prisma.
      delete argv.cwd
    } else if (process.env.RWJS_CWD) {
      cwd = process.env.RWJS_CWD
    } else {
      cwd = path.dirname(getConfigPath())
    }

    configPath = path.resolve(process.cwd(), cwd, 'redwood.toml')
    if (!fs.existsSync(configPath)) {
      throw new Error('Could not find `redwood.toml` config file.')
    }

    process.env.RWJS_CWD = cwd
  } catch (e) {
    console.error([
      '',
      'Error: Redwood CLI could not find your config file.',
      `Expected '${configPath}'`,
      '',
      `Did you run Redwood CLI in a RedwoodJS project?`,
      `Or specify an incorrect '--cwd' option?`,
      '',
    ])

    process.exit(1)
  }
}

function getRedwoodProjectMiddleware(argv) {
  const paths = getPaths()

  argv.redwoodProject = {
    paths: paths,
    hasApiSide: fs.existsSync(paths.api.src),
    hasWebSide: fs.existsSync(paths.web.src),
  }
}

function getColorsMiddleware(argv) {
  argv.colors = colors
}

function loadDotEnvDefaultsMiddleware(argv) {
  config({
    path: path.join(argv.redwoodProject.paths.base, '.env'),
    defaults: path.join(argv.redwoodProject.paths.base, '.env.defaults'),
    encoding: 'utf8',
  })
}
