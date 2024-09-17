#!/usr/bin/env node
/* eslint-env node */
// @ts-check

// There are a few footguns to running a smoke tests locally. (And if you have to run a smoke tests locally, it's already painful enough.)
//
// - you don't have a test project, or you're running against a different test project than you expect
// - `yarn rwfw project:sync` isn't running
//
// This script checks for them.

// Checklist for manual testing:
// If you're editing this script, make sure to test the following:

// - [ ] outputs a help message and exits if `--help` or `-h` is passed (`yarn smoke-tests -h`), even if errors would surface later
// - [ ] errors if the `REDWOOD_TEST_PROJECT_PATH` env var isn't set (`unset REDWOOD_TEST_PROJECT_PATH`)
// - [ ] errors if the test project at `REDWOOD_TEST_PROJECT_PATH` doesn't exist
// - [ ] warns if `yarn rwfw project:sync` isn't running
// - [ ] errors if passed invalid positional args (`yarn smoke-tests bazinga`) and shows the help message
// - [ ] errors if passed invalid flags (`yarn smoke-tests --bazinga`) and shows the help message
// - [ ] prompts for which smoke tests to run if passed no positional args (`yarn smoke-tests`)
// - [ ] runs the smoke test(s) specified if passed valid positional args (`yarn smoke-tests dev`)
// - [ ] errors if the test project isn't built and the prerender or serve smoke tests are specified
// - [ ] passes `--playwrightOptions` to `npx playwright test` (`yarn smoke-tests --playwrightOptions="--debug"`)

import { fileURLToPath } from 'node:url'
import util from 'node:util'

import execa from 'execa'
import prompts from 'prompts'
import { cd, chalk, fs, path, within, $ } from 'zx'

async function main() {
  let options

  try {
    options = await parseArgs()
  } catch (e) {
    console.error(e.message)
    return
  }

  const { smokeTests, testProjectPath, playwrightOptions } = options

  for (const smokeTest of smokeTests) {
    console.log(
      `Running ${chalk.magenta(smokeTest)} smoke test against ${chalk.magenta(
        testProjectPath,
      )}\n`,
    )

    await within(async () => {
      cd(fileURLToPath(new URL(`./${smokeTest}`, import.meta.url)))

      try {
        await $`npx playwright test ${playwrightOptions}`
      } catch (e) {
        // Let the others run, but make sure we exit with a non-zero exit code.
        process.exitCode = 1
      }
    })
  }
}

main()

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parses the command line arguments and returns an object containing the parsed values.
 *
 * @typedef {Object} CliArgs
 * @property {string} testProjectPath The path to the test project.
 * @property {string[]} smokeTests The smoke tests to run.
 * @property {string | undefined} playwrightOptions The options to forward to `npx playwright test`.
 *
 * @returns {Promise<CliArgs>} The parsed command line arguments.
 */
async function parseArgs() {
  let positionals
  let values

  const options = {
    testProjectPath: {
      description: `Path to the test project. Defaults to the ${chalk.magenta(
        'REDWOOD_TEST_PROJECT_PATH',
      )} env var`,
      short: 'p',
      type: /** @type {const} */ ('string'),
      default:
        process.env.REDWOOD_TEST_PROJECT_PATH ?? process.env.PROJECT_PATH,
    },

    playwrightOptions: {
      description: `Options to forward to ${chalk.cyan('npx playwright test')}`,
      type: /** @type {const} */ ('string'),
      default: '',
    },

    help: {
      description: 'Show help',
      short: 'h',
      type: /** @type {const} */ ('boolean'),
      default: false,
    },
  }

  try {
    const parsedArgs = util.parseArgs({
      allowPositionals: true,
      options,
    })

    positionals = parsedArgs.positionals
    values = parsedArgs.values
  } catch (e) {
    if (e.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') {
      // Message is something like...
      //
      // ```
      // `Unknown option '--baz'. To specify a positional argument starting with a '-',
      // place it at the end of the command after '--', as in '-- "--baz"`
      // ```
      //
      // I find the first part of it valuable, but don't want to encourage the user to pass `--` to this script.
      // So while this may be brittle, I'm just going to split the message on `.` and only show the first part.
      const [unknownOptionMessage] = e.message.split('.')

      throw new Error(
        [
          chalk.red(`Error: ${unknownOptionMessage}.`),
          '',
          getHelp(options),
          '',
        ].join('\n'),
      )
    }

    throw e
  }

  const { help, testProjectPath, playwrightOptions } = values

  // If the user passes `--help`, we show them the help message and exit, even if errors would surface later on.
  if (help) {
    throw new Error(`${getHelp(options)}\n`)
  }

  // Handle `testProjectPath` not being set.
  if (typeof testProjectPath !== 'string') {
    process.exitCode = 1
    throw new Error(
      [
        chalk.red('Error: No test project to run smoke tests against.'),
        '',
        `If you haven't generated a test project, do so first: ${chalk.green(
          'yarn build:test-project --link <path>',
        )}.`,
        `Then set the ${chalk.magenta(
          'REDWOOD_TEST_PROJECT_PATH',
        )} env var to the path of your test project.`,
        '',
      ].join('\n'),
    )
  }

  if (typeof playwrightOptions !== 'string') {
    // This should never happen. Node's parseArgs should make sure of that.
    // Only have this to make TypeScript happy.
    process.exitCode = 1
    throw new Error(chalk.red('Error: playwrightOptions must be a string.'))
  }

  if (!(await fs.exists(testProjectPath))) {
    process.exitCode = 1
    throw new Error(
      [
        chalk.red("Error: Test project doesn't exist."),
        '',
        `The test project path you specified (${chalk.magenta(
          testProjectPath,
        )}) doesn't exist.`,
        `Make sure you've generated a test project: ${chalk.green(
          'yarn build:test-project --link <path>',
        )}.`,
        `Then set the ${chalk.magenta(
          'REDWOOD_TEST_PROJECT_PATH',
        )} env var to the path of your test project.`,
        '',
      ].join('\n'),
    )
  }

  // The user can pass a smoke test to run as the first argument; if they don't, we prompt them for it.
  //
  // ```
  // yarn node ./tasks/smoke-tests/smoke-tests.mjs dev auth
  // ```
  let smokeTests = positionals

  const availableSmokeTests = (
    await fs.readdir(new URL('./', import.meta.url), {
      withFileTypes: true,
    })
  )
    .filter((dirent) => dirent.isDirectory() && dirent.name !== 'shared')
    .map((dirent) => dirent.name)

  const invalidSmokeTest = smokeTests.find(
    (smokeTest) => !availableSmokeTests.includes(smokeTest),
  )

  // Error if the user passed an invalid smoke test.
  if (invalidSmokeTest) {
    process.exitCode = 1
    throw new Error(
      [
        chalk.red(`Error: Invalid smoke test \`${invalidSmokeTest}\`.`),
        '',
        'Available smoke tests:',
        '',
        ...availableSmokeTests.map((test) => `• ${chalk.green(test)}`),
        '',
        getHelp(options),
        '',
      ].join('\n'),
    )
  }

  // Check if `yarn rwfw project:sync` is running.
  const { stdout } = await execa.command('ps aux')
  const isProjectSyncRunning = stdout.includes('frameworkSyncToProject.mjs')

  if (!isProjectSyncRunning) {
    console.warn(
      chalk.yellow(
        'Warning: If you want to test against the framework, you must have `yarn rwfw project:sync` running in your test project.',
      ),
    )
  }

  // Prompt for which smoke test(s) to run if none were passed as positional args.
  if (!smokeTests.length) {
    const choices = availableSmokeTests.map((smokeTest) => {
      return {
        title: smokeTest,
        value: smokeTest,
      }
    })

    const answer = await prompts(
      {
        type: 'multiselect',
        name: 'smokeTests',
        message: 'Which smoke test(s) would you like to run?',

        choices,
        min: 1,

        // These are the default instructions with a space added to the end.
        // With the defaults, if the user doesn't select an option, the error renders right next to the last line:
        //
        // ```
        // enter/return: Complete answerYou must select a minimum of 1 choices.
        // ```
        instructions: [
          'Instructions:',
          '    ↑/↓: Highlight option',
          '    ←/→/[space]: Toggle selection',
          '    a: Toggle all',
          '    enter/return: Complete answer ',
        ].join('\n'),
      },
      {
        onCancel: () => {
          process.exitCode = 1
          throw new Error()
        },
      },
    )

    smokeTests = answer.smokeTests
  }

  // The test project has to be built before running the prerender or serve smoke tests.
  const isTestProjectBuilt =
    fs.existsSync(path.join(testProjectPath, 'web', 'dist')) &&
    fs.existsSync(path.join(testProjectPath, 'api', 'dist'))

  if (
    smokeTests.some((smokeTest) =>
      ['prerender', 'serve'].includes(smokeTest),
    ) &&
    !isTestProjectBuilt
  ) {
    process.exitCode = 1
    throw new Error(
      [
        chalk.red(
          'Error: You must build the test project before running the prerender or serve smoke tests.',
        ),
        '',
        chalk.green(`  cd ${testProjectPath}`),
        chalk.green(`  yarn rw build`),
        '',
      ].join('\n'),
    )
  }

  return {
    testProjectPath,
    smokeTests,
    playwrightOptions,
  }
}

function getHelp(options) {
  // Find the length of the longest option and justify the text based on it.
  const longestOptionLength = Object.entries(options).reduce(
    (max, [name]) => Math.max(max, name.length),
    0,
  )

  const justifiedOptions = Object.entries(options).map(([name, config]) => {
    const paddedFlag = name.padEnd(longestOptionLength, ' ')
    return [
      '•',
      chalk.green(`--${paddedFlag}`),
      config.description,
      config.default && chalk.dim(`(default: ${config.default})`),
    ]
      .filter(Boolean)
      .join(' ')
  })

  return [
    chalk.bold('# 🔄 Smoke tests'),
    '',
    "Use this script to run Redwood's smoke tests locally.",
    '',
    chalk.bold('## Usage'),
    '',
    chalk.green('  yarn smoke-tests [options] [smoke-test..]'),
    '',
    `Make sure you've got a test project. (You can make one via ${chalk.green(
      'yarn build:test-project --link <path>',
    )}.)`,
    `Then set the ${chalk.magenta(
      'REDWOOD_TEST_PROJECT_PATH',
    )} env var to the path of your test project.`,
    '',
    chalk.dim('  # Let this script prompt you for which smoke test to run'),
    chalk.cyan('  REDWOOD_TEST_PROJECT_PATH=<path> yarn smoke-tests '),
    '',
    chalk.dim('  # Run the dev smoke test'),
    chalk.cyan('  REDWOOD_TEST_PROJECT_PATH=<path> yarn smoke-tests dev'),
    '',
    chalk.dim(
      '  # Pass flags to `npx playwright test` (see `npx playwright test --help`)',
    ),
    chalk.cyan(
      '  REDWOOD_TEST_PROJECT_PATH=<path> yarn smoke-tests --playwrightOptions="--debug"',
    ),
    '',
    chalk.bold('## Options'),
    '',
    ...justifiedOptions,
  ].join('\n')
}
