#!/usr/bin/env node
/* eslint-env node */
// @ts-check

import { fileURLToPath } from 'node:url'

import { cd, chalk, fs, path, question, within, $ } from 'zx'

async function main() {
  const showHelp = ['--help', '-h'].some((flag) => process.argv.includes(flag))

  if (showHelp) {
    console.log(
      [
        '🔄 Smoke tests',
        '',
        "Use this script to run Redwood's smoke tests locally",
        '',
        'Usage:',
        chalk.gray(
          '  # Let this script prompt you for which smoke test to run'
        ),
        '  REDWOOD_TEST_PROJECT_PATH=<path> yarn smoke-tests ',
        '',
        chalk.gray('  # Run the dev smoke test'),
        '  REDWOOD_TEST_PROJECT_PATH=<path> yarn smoke-tests dev',
        '',
        chalk.gray(
          '  # Pass flags to playwright test (see `yarn playwright test --help`)'
        ),
        '  REDWOOD_TEST_PROJECT_PATH=<path> yarn smoke-tests -- --headed',
      ].join('\n')
    )

    return
  }

  // `PROJECT_PATH` is deprecated.
  const testProjectPath =
    process.env.REDWOOD_TEST_PROJECT_PATH ?? process.env.PROJECT_PATH

  // Handle there being no test project to run against.
  if (testProjectPath === undefined) {
    process.exitCode = 1
    console.error(
      [
        chalk.red('Error: No test project to run smoke tests against.'),
        "If you haven't generated a test project, do so first via...",
        '',
        '  yarn build:test-project --link <your test project path>',
        '',
        `Then set the ${chalk.magenta(
          'REDWOOD_TEST_PROJECT_PATH'
        )} env var to the path of your test project and run this script again.`,
      ].join('\n')
    )
    return
  }

  // The user can pass a smoke test to run as the first argument; if they don't, we can prompt them for it
  const smokeTestsDir = path.dirname(fileURLToPath(import.meta.url))
  let smokeTest = process.argv[2]
  const smokeTests = fs
    .readdirSync(path.dirname(fileURLToPath(import.meta.url)), {
      withFileTypes: true,
    })
    .filter((dirent) => dirent.isDirectory() && dirent.name !== 'shared')
    .map((dirent) => dirent.name)

  if (smokeTest === undefined) {
    console.log(
      [
        'Available smoke tests:',
        '',
        ...smokeTests.map((test) => `- ${test}`),
        '- all (runs them all)',
        '',
      ].join('\n')
    )

    smokeTest = await question('Which smoke test would you like to run? ', {
      choices: [...smokeTests, 'all'],
    })
    console.log()
  }

  // The test project has to be built before running the prerender or serve smoke tests.
  const isTestProjectBuilt =
    fs.existsSync(path.join(testProjectPath, 'web', 'dist')) &&
    fs.existsSync(path.join(testProjectPath, 'api', 'dist'))

  if (
    ['prerender', 'serve', 'all'].includes(smokeTest) &&
    !isTestProjectBuilt
  ) {
    process.exitCode = 1

    console.error(
      [
        chalk.red(
          'Error: You must build your test project before running the prerender or serve smoke tests.'
        ),
        '',
        `  cd ${testProjectPath}`,
        `  yarn rw build`,
        '',
      ].join('\n')
    )

    return
  }

  const playwrightOptions = []
  const playwrightOptionsDelimiter = process.argv.findIndex(
    (option) => option === '--'
  )

  if (playwrightOptionsDelimiter !== -1) {
    playwrightOptions.push(
      ...process.argv.slice(playwrightOptionsDelimiter + 1)
    )
  }

  /**
   * @param {string} smokeTest
   * @returns {Promise<void>}
   */
  async function runSmokeTest(smokeTest) {
    console.log(
      `Running ${chalk.magenta(smokeTest)} smoke test against ${chalk.magenta(
        testProjectPath
      )}...`
    )
    console.log()

    await within(async () => {
      cd(path.join(smokeTestsDir, smokeTest))

      try {
        await $`npx playwright test ${playwrightOptions}`
      } catch (e) {
        process.exitCode = 1
      }
    })
  }

  if (smokeTest === 'all') {
    for (const smokeTest of smokeTests) {
      await runSmokeTest(smokeTest)
      console.log('-'.repeat(process.stdout.columns))
    }
  } else {
    await runSmokeTest(smokeTest)
  }
}

main()
