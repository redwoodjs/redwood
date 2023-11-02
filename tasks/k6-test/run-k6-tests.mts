#!/usr/bin/env node
/* eslint-env node, es6*/

import os from 'node:os'
import path from 'node:path'
import url from "node:url"

import chalk from 'chalk'
import execa, { ExecaChildProcess } from 'execa'
import fg from 'fast-glob'
import fs from 'fs-extra'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { buildRedwoodFramework, addFrameworkDepsToProject, cleanUp, copyFrameworkPackages, createRedwoodJSApp, initGit, runYarnInstall, changeTomlConfig } from "./util/util.mjs"

// Parse input
const args = yargs(hideBin(process.argv))
  .positional('project-directory', {
    type: 'string',
    describe: 'The project directory to run the k6 tests in',
    demandOption: false,
  })
  .option('setup', { default: [], type: 'array', alias: 's' })
  .option('test', { default: [], type: 'array', alias: 't' })
  .option('clean-up', { default: true, type: 'boolean' })
  .option('verbose', { default: false, type: 'boolean' })
  .help()
  .parseSync()


// useful consts
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const REDWOODJS_FRAMEWORK_PATH = path.join(__dirname, '..', '..')
const REDWOOD_PROJECT_DIRECTORY =
  args._?.[0]?.toString() ??
  path.join(
    os.tmpdir(),
    'redwood-k6-test',
    // ":" is problematic with paths
    new Date().toISOString().split(':').join('-')
  )
const SETUPS_DIR = path.join(__dirname, 'setups')
const TESTS_DIR = path.join(__dirname, 'tests')

// Commands to start an api server
const API_SERVER_COMMANDS = [
  {
    name: 'CLI: serve api',
    command: `node ${path.resolve(REDWOOD_PROJECT_DIRECTORY, 'node_modules/@redwoodjs/cli/dist/index.js')} serve api`,
    host: 'http://127.0.0.1:8911',
    skip: () => false
  },
  {
    name: 'CLI: serve',
    command: `node ${path.resolve(REDWOOD_PROJECT_DIRECTORY, 'node_modules/@redwoodjs/cli/dist/index.js')} serve`,
    host: 'http://127.0.0.1:8910/.redwood/functions',
    skip: () => false
  },
  {
    name: 'CLI: dev',
    command: `node ${path.resolve(REDWOOD_PROJECT_DIRECTORY, 'node_modules/@redwoodjs/cli/dist/index.js')} dev`,
    host: 'http://127.0.0.1:8911',
    skip: () => false
  },
  {
    name: '@redwoodjs/api-server: api',
    command: `node ${path.resolve(REDWOOD_PROJECT_DIRECTORY, 'node_modules/@redwoodjs/api-server/dist/index.js')} api`,
    host: 'http://127.0.0.1:8911',
    skip: () => false
  },
  {
    name: 'server file: node api/dist/server.js',
    command: `node ${path.resolve(REDWOOD_PROJECT_DIRECTORY, 'api/dist/server.js')}`,
    host: 'http://127.0.0.1:8911',
    skip: () => !fs.existsSync(path.resolve(REDWOOD_PROJECT_DIRECTORY, 'api/dist/server.js'))
  }
]

// Server start/stop
let serverSubprocess: ExecaChildProcess | undefined
const startServer = async (command: string, heathcheck: string) => {
  serverSubprocess = execa.command(command, {
    cwd: REDWOOD_PROJECT_DIRECTORY,
    stdio: args.verbose ? 'inherit' : 'ignore',
  })
  const checkConnection = async () => {
    try {
      await fetch(heathcheck)
      return true
    } catch (_error) {
      // ignore
    }
    return false
  }
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    if (await checkConnection()) {
      return
    }
  }
  throw new Error(`Could not start server with: ${command}`)
}
const stopServer = async () => {
  if (!serverSubprocess) {
    return
  }
  serverSubprocess.cancel()
  try {
    await serverSubprocess
  } catch (_error) {
    // ignore
  }
}

async function main() {
  const divider = chalk.blue('~'.repeat(process.stdout.columns))

  console.log(`${divider}\nK6 tests\n${divider}`)
  console.log('Benchmark tests will be run in the following directory:')
  console.log(`${REDWOOD_PROJECT_DIRECTORY}`)

  fs.mkdirSync(REDWOOD_PROJECT_DIRECTORY, { recursive: true })

  // Register clean up
  if (args.cleanUp) {
    let cleanUpExecuted = false
    console.log('\nThe directory will be deleted after the tests are run')
    process.on('SIGINT', () => {
      if (!cleanUpExecuted) {
        cleanUp({
          projectPath: REDWOOD_PROJECT_DIRECTORY,
        })
        cleanUpExecuted = true
      }
    })
    process.on('exit', () => {
      if (!cleanUpExecuted) {
        cleanUp({
          projectPath: REDWOOD_PROJECT_DIRECTORY,
        })
        cleanUpExecuted = true
      }
    })
  }

  // Get all the setups
  const setups = fg
    .sync('*', {
      onlyDirectories: true,
      cwd: SETUPS_DIR,
    })
    .filter((setupDir) => {
      return (
        args.setup.length === 0 ||
        args.setup.some((setup) => setupDir.includes(setup.toString()))
      )
    })

  if (setups.length === 0) {
    console.log('There are no setups to run.')
    process.exit(0)
  }

  // Create a test project and sync the current framework state
  console.log('\nCreating a fresh project:')
  console.log('- building the framework')
  buildRedwoodFramework({
    frameworkPath: REDWOODJS_FRAMEWORK_PATH,
    verbose: args.verbose,
  })
  console.log('- creating a new project')
  createRedwoodJSApp({
    frameworkPath: REDWOODJS_FRAMEWORK_PATH,
    projectPath: REDWOOD_PROJECT_DIRECTORY,
    typescript: true,
    verbose: args.verbose,
  })
  console.log('- changing the toml config')
  changeTomlConfig({
    projectPath: REDWOOD_PROJECT_DIRECTORY,
  })
  console.log('- syncing the framework dependencies')
  addFrameworkDepsToProject({
    frameworkPath: REDWOODJS_FRAMEWORK_PATH,
    projectPath: REDWOOD_PROJECT_DIRECTORY,
    verbose: args.verbose,
  })
  console.log('- installing dependencies')
  runYarnInstall({
    projectPath: REDWOOD_PROJECT_DIRECTORY,
    verbose: args.verbose,
  })
  console.log('- copying framework packages')
  copyFrameworkPackages({
    frameworkPath: REDWOODJS_FRAMEWORK_PATH,
    projectPath: REDWOOD_PROJECT_DIRECTORY,
    verbose: args.verbose,
  })
  console.log('- initializing git')
  initGit({
    projectPath: REDWOOD_PROJECT_DIRECTORY,
    verbose: args.verbose,
  })

  // Results collection
  const results: {
    [setup: string]: {
      [test: string]: ({
        passed: boolean
        metrics?: {
          http_reqs: {
            values: {
              count: number
            }
          }
          http_req_duration: {
            values: {
              'p(90)': number
            }
          }
          http_req_waiting: {
            values: {
              'p(90)': number
            }
          }
        }
      } | null)[]
    }
  } = {}

  console.log('The following setups will be run:')
  for (let i = 0; i < setups.length; i++) {
    console.log(`- ${setups[i]}`)
  }

  for (const setup of setups) {
    // import the setup
    const setupFile = path.join(SETUPS_DIR, setup, 'setup.mjs')
    const setupModule = await import(setupFile)
    const runForTests = args.test.length === 0 ?
      setupModule.validForTests :
      args.test.filter((test) => setupModule.validForTests.includes(test))

    console.log(`\n${divider}\nPreparing setup: ${setup}\n${divider}`)

    if (runForTests.length === 0) {
      console.log(`There are no tests to run for setup ${setup}, skipping...`)
      continue
    }

    // Clean up the project state
    console.log(`Cleaning up the project state...`)
    await execa('git', ['reset', '--hard'], {
      cwd: REDWOOD_PROJECT_DIRECTORY,
      stdio: args.verbose ? 'inherit' : 'ignore',
    })
    await execa('git', ['clean', '-fd'], {
      cwd: REDWOOD_PROJECT_DIRECTORY,
      stdio: args.verbose ? 'inherit' : 'ignore',
    })

    // Run the setup
    console.log(`Running setup: ${setup}`)
    await setupModule.setup({
      projectPath: REDWOOD_PROJECT_DIRECTORY,
    })

    // Build the app
    console.log('Building the project...')
    await execa('yarn', ['rw', 'build'], {
      cwd: REDWOOD_PROJECT_DIRECTORY,
      stdio: args.verbose ? 'inherit' : 'ignore',
    })

    // Run the tests
    for (let i = 0; i < runForTests.length; i++) {
      results[setup] ??= {}
      results[setup][runForTests[i]] ??= []

      // Run for different server commands
      for (let j = 0; j < API_SERVER_COMMANDS.length; j++) {
        const server = API_SERVER_COMMANDS[j]
        if (server.skip()) {
          results[setup][runForTests[i]].push(null)
          continue
        }

        console.log(`\n${divider}`)
        console.log(`Running test ${i * API_SERVER_COMMANDS.length + j + 1}/${runForTests.length * API_SERVER_COMMANDS.length}: ${runForTests[i]}`)
        console.log(chalk.dim(server.name))
        console.log(`${divider}`)

        // Start the server
        try {
          await startServer(server.command, server.host)
        } catch (_error) {
          console.log(`Could not start server with command: ${server.command}`)
          continue
        }

        // Run k6 test
        let passed = false
        try {
          await execa('k6', ['run', path.join(TESTS_DIR, `${runForTests[i]}.js`), '--env', `TEST_HOST=${server.host}`], {
            cwd: REDWOOD_PROJECT_DIRECTORY,
            stdio: 'inherit',
          })
          passed = true
        } catch (_error) {
          // ignore
        }

        const result = fs.readJSONSync(path.join(REDWOOD_PROJECT_DIRECTORY, 'summary.json'), {
          throws: false,
          flag: 'r',
          encoding: 'utf-8',
        }) ?? {}
        results[setup][runForTests[i]].push({
          passed,
          metrics: result.metrics
        })

        // Stop the server
        await stopServer()
      }
    }

    // Explictly clear the dist folder
    console.log('Building the project...')
    await execa('rm', ['-r', 'api/dist'], {
      cwd: REDWOOD_PROJECT_DIRECTORY,
      stdio: args.verbose ? 'inherit' : 'ignore',
    })

  }

  // Print results
  let hadFailure = false
  console.log(`\n${divider}\nResults:\n${divider}`)
  for (const setup in results) {
    console.log(chalk.bgBlue(`\nSetup: ${setup}`))
    for (const test in results[setup]) {
      for (let i = 0; i < results[setup][test].length; i++) {
        if (results[setup][test][i] === null) {
          continue
        }

        const passed = results[setup][test][i]?.passed
        const bgColor = passed ? chalk.bgGreen : chalk.bgRed
        const bgPrefix = bgColor(' ')
        console.log(passed ? bgColor(' PASS ') : bgColor(' FAIL '))
        console.log(`${bgPrefix} Test: ${test} [${API_SERVER_COMMANDS[i].name}]`)
        console.log(`${bgPrefix}   Requests: ${results[setup][test][i]?.metrics?.http_reqs.values.count}`)
        console.log(`${bgPrefix}   Duration (p90): ${results[setup][test][i]?.metrics?.http_req_duration.values['p(90)'].toFixed(3)}`)
        console.log(`${bgPrefix}   TTFB (p90): ${results[setup][test][i]?.metrics?.http_req_waiting.values['p(90)'].toFixed(3)}`)
        console.log()

        if (!passed) {
          hadFailure = true
        }
      }
    }
  }

  // Exit code
  process.exitCode ||= hadFailure ? 1 : 0
}

main()
