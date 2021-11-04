#!/usr/bin/env node
/**
 * This file is the CLI's main entry point.
 * (This is specified in the package.json's `bin` property.)
 *
 * ```
 * yarn rw # <-- you are here
 * ```
 *
 * This file:
 *
 * 1) sets up up middleware
 * 2) loads the rest of the CLI via this package's command-module structure.
 *
 * @see {@link https://github.com/yargs/yargs/blob/main/docs/advanced.md#providing-a-command-module}
 *
 * @remarks
 *
 * The yargs codebase can appear to be a bit complicated at first.
 * If you ever have to dig into the source, know that most of the methods are defined here:
 * {@link https://github.com/yargs/yargs/blob/3d2a6aa8c954a58589d7a199b2496bd894dcde25/lib/yargs-factory.ts}
 */
import fs from 'fs'
import path from 'path'

import { config } from 'dotenv-defaults'
import { hideBin } from 'yargs/helpers'
/**
 * This is the blessed way of doing things now, as opposed to:
 *
 * ```
 * import yargs from 'yargs
 * ```
 *
 * The above is the older, singleton API, which hasn't been deprecated but has been discouraged:
 * {@link https://github.com/yargs/yargs/issues/2045#issuecomment-942442554}
 */
import yargs from 'yargs/yargs'

import { getPaths, getConfigPath } from '@redwoodjs/internal'

/**
 * Yargs middleware.
 *
 * Middleware functions get access to `argv`:
 * {@link https://yargs.js.org/docs/#api-reference-middlewarecallbacks-applybeforevalidation}
 *
 * This middleware parses, validates, and sets current working directory in the following order:
 *
 * 1. the `--cwd` option
 * 2. the `RWJS_CWD` env var
 * 3. by traversing directories upwards for the first `redwood.toml`
 *
 * This is mainly for contributors.
 *
 * @param {import('yargs').Argv} argv
 */
const setCwdMiddleware = (argv) => {
  let configPath

  try {
    let cwd

    if (argv.cwd) {
      cwd = argv.cwd

      /**
       * We delete `cwd` because it's not actually referenced in the CLI.
       * We use the `RWJS_CWD` env var instead.
       * That, and it conflicts with "forwarding" commands such as test and prisma.
       */
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
    console.error()
    console.error('Error: Redwood CLI could not find your config file.')
    console.error(`Expected '${configPath}'`)
    console.error()
    console.error(`Did you run Redwood CLI in a RedwoodJS project?`)
    console.error(`Or specify an incorrect '--cwd' option?`)
    console.error()
    process.exit(1)
  }
}

/**
 * Loads the env vars in `.env` and `.env.defaults`.
 *
 * @remarks
 *
 * We should only do this if we're in a Redwood project,
 * which is why this is a middleware function that comes after `setCwdMiddleware`.
 */
const loadDotEnvDefaultsMiddleware = () => {
  const { base } = getPaths()

  config({
    path: path.join(base, '.env'),
    defaults: path.join(base, '.env.defaults'),
    encoding: 'utf8',
  })
}

// eslint-disable-next-line no-unused-expressions
/**
 * `yargs` takes an array (which is what `process.argv` is),
 * but yargs expects this array to only have the args that come after program name.
 * So if the command run at the CLI is:
 *
 * ```
 * yarn rw --help
 * ```
 *
 * yargs expects `['--help']`, not `['rw', '--help']`.
 *
 * `hideBin` is a yargs helper-function that removes the program name from the array for us:
 * {@link https://yargs.js.org/docs/#api-reference}
 *
 * @remarks
 *
 * Assigning the return of this to a variable
 * because we should be able to run the cli "programmatically" this way:
 * - {@link https://github.com/yargs/yargs/issues/1605}
 * - {@link https://yargs.js.org/docs/#api-reference-parseargs-context-parsecallback}
 */
const parser = yargs(hideBin(process.argv))
  .scriptName('rw')
  .middleware([setCwdMiddleware, loadDotEnvDefaultsMiddleware])
  .option('cwd', {
    demandOption: false,
    description:
      'Current working directory to use (i.e., where `redwood.toml` is located). Useful for development',
    type: 'string',
  })
  .example(
    '$0 g page home /',
    "Create a page component named 'Home' at path '/'"
  )
  .commandDir('./commands')
  .demandCommand(1, '')
  .recommendCommands()
  .strict()

/**
 * `yargs` seems to be moving away from `argv`:
 * {@link https://github.com/yargs/yargs/pull/2036}
 *
 * Note that calling `parse` with no args is equivalent to `argv`.
 * - {@link https://yargs.js.org/docs/#api-reference}
 * - {@link https://github.com/yargs/yargs/blob/3d2a6aa8c954a58589d7a199b2496bd894dcde25/lib/yargs-factory.ts#L72-L77}
 *
 * @remarks
 *
 * This should pretty much only ever be used here, at the top level, according to:
 * {@link https://yargs.js.org/docs/#api-reference-argv}
 */
parser.parse()
