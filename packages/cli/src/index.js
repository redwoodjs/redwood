#!/usr/bin/env node
import path from 'path'

import { config } from 'dotenv-defaults'
import yargs from 'yargs'

import { getPaths, getConfig, getConfigPath } from '@redwoodjs/internal'

/**
 * The current working directory can be set via:
 * 1. A `--cwd` option
 * 2. The `RWJS_CWD` env-var
 * 3. Found by traversing directories upwards for the first `redwood.toml`
 *
 * This middleware parses, validates, and sets current working directory
 * in the order above.
 */
const getCwdMiddleware = (argv) => {
  let configPath
  try {
    let cwd
    if (argv.cwd) {
      cwd = argv.cwd
    } else if (process.env.RWJS_CWD) {
      cwd = process.env.RWJS_CWD
    } else {
      cwd = getConfigPath()
    }

    configPath = path.resolve(process.cwd(), cwd, 'redwood.toml')
    getConfig(configPath)
    argv.cwd = cwd
    process.env.RWJS_CWD = cwd
  } catch (e) {
    console.error()
    console.error(
      'Error: Redwood CLI could not find, or parse, your configuration file.'
    )
    console.error(`We expected '${configPath}'`)
    console.error()
    console.error(`Did you run Redwood CLI in a RedwoodJS project?`)
    console.error(`Or specify an incorrect '--cwd' option?`)
    console.error()
    process.exit()
  }
}

const loadDotEnvDefaultsMiddleware = () => {
  config({
    path: path.join(getPaths().base, '.env'),
    encoding: 'utf8',
    defaults: path.join(getPaths().base, '.env.defaults'),
  })
}

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('rw')
  .middleware([getCwdMiddleware, loadDotEnvDefaultsMiddleware])
  .option('cwd', {
    describe: 'Working directory to use (where `redwood.toml` is located.)',
  })
  .commandDir('./commands')
  .example(
    'yarn rw g page home /',
    "\"Create a page component named 'Home' at path '/'\""
  )
  .demandCommand()
  .strict().argv
