#!/usr/bin/env node
/* eslint-env node, es6*/

import os from 'node:os'
import path from 'node:path'
import url from "node:url"

import execa from 'execa'
import fg  from 'fast-glob'
import fs from 'fs-extra'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'
import { $ } from 'zx'

import { buildRedwoodFramework, addFrameworkDepsToProject, cleanUp, copyFrameworkPackages, createRedwoodJSApp, initGit, runYarnInstall } from "./util/util.mjs"

// useful consts
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Parse input
const args = yargs(hideBin(process.argv))
  .positional('project-directory', {
    type: 'string',
    describe: 'The project directory to run the benchmarks in',
    demandOption: false,
  })
  .option('setup', { default: [], type: 'array', alias: 's' })
  .option('test', { default: [], type: 'array', alias: 't' })
  .option('clean-up', { default: true, type: 'boolean' })
  .scriptName('run-benchmarks')
  .example('run-benchmarks', 'Run all the benchmarks')
  .example(
    'run-benchmarks /tmp/redwood-app --setup someSetup --test somTest anotherTest',
    "Run the benchmarks only for the setup 'someSetup' and the tests 'someTest' and 'anotherTest'"
  )
  .help()
  .parseSync()

const REDWOODJS_FRAMEWORK_PATH = path.join(__dirname, '..', '..')
const REDWOOD_PROJECT_DIRECTORY =
  args._?.[0]?.toString() ??
  path.join(
    os.tmpdir(),
    'redwood-benchmark',
    // ":" is problematic with paths
    new Date().toISOString().split(':').join('-')
  )

const SETUPS_DIR = path.join(__dirname, 'setups')
const TESTS_DIR = path.join(__dirname, 'tests')
let cleanUpExecuted = false

async function main() {
  const divider = '~'.repeat(process.stdout.columns)

  console.log(`${divider}\nBenchmark tests\n${divider}\n`)
  console.log('Benchmark tests will be run in the following directory:')
  console.log(`${REDWOOD_PROJECT_DIRECTORY}\n`)

  fs.mkdirSync(REDWOOD_PROJECT_DIRECTORY, { recursive: true })

  // Register clean up
  if (args.cleanUp) {
    console.log('The directory will be deleted after the tests are run')
    process.on('SIGINT', () => {
      if(!cleanUpExecuted){
        cleanUp({
          projectPath: REDWOOD_PROJECT_DIRECTORY,
        })
        cleanUpExecuted = true
      }
    })
    process.on('exit', () => {
      if(!cleanUpExecuted){
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
    console.log('\nThere are no setups to run.')
    process.exit(0)
  }

  // Create a test project and sync the current framework state
  console.log('\nCreating a fresh project:')

  buildRedwoodFramework({
    frameworkPath: REDWOODJS_FRAMEWORK_PATH,
  })
  createRedwoodJSApp({
    frameworkPath: REDWOODJS_FRAMEWORK_PATH,
    projectPath: REDWOOD_PROJECT_DIRECTORY,
    typescript: true
  })
  addFrameworkDepsToProject({
    frameworkPath: REDWOODJS_FRAMEWORK_PATH,
    projectPath: REDWOOD_PROJECT_DIRECTORY,
  })
  runYarnInstall({
    projectPath: REDWOOD_PROJECT_DIRECTORY,
  })
  copyFrameworkPackages({
    frameworkPath: REDWOODJS_FRAMEWORK_PATH,
    projectPath: REDWOOD_PROJECT_DIRECTORY,
  })
  initGit({
    projectPath: REDWOOD_PROJECT_DIRECTORY,
  })

  // zx setup
  $.verbose = false
  $.cwd = REDWOOD_PROJECT_DIRECTORY
  $.log = () => {}

  console.log('\nThe following setups will be run:')
  for(let i = 0; i < setups.length; i++){
    console.log(`- ${setups[i]}`)
  }

  for (const setup of setups) {
    // import the setup
    const setupFile = path.join(SETUPS_DIR, setup, 'setup.mjs')
    const setupModule = await import(setupFile)
    const runForTests = args.test.length === 0 ?
      setupModule.validForTests :
      args.test.filter((test) => setupModule.validForTests.includes(test))

    if(runForTests.length === 0){
      console.log(`\nThere are no tests to run for setup ${setup}, skipping...`)
      continue
    }

    // Clean up the project state
    console.log(`\nCleaning up the project state...`)
    await $`git reset --hard`
    await $`git clean -fd`

    // Run the setup
    console.log(`\nRunning setup: ${setup}\n`)
    await setupModule.setup({
      projectPath: REDWOOD_PROJECT_DIRECTORY,
    })

    // Build the app
    console.log('- Building the api...')
    await execa('yarn', ['rw', 'build', 'api'], {
      cwd: REDWOOD_PROJECT_DIRECTORY,
      stdio: 'inherit'
    })

    // Run the tests
    for(let i = 0; i < runForTests.length; i++){
      console.log(`\nRunning test ${i+1}/${runForTests.length}: ${runForTests[i]}`)

      // Start the server
      const serverSubprocess = $`yarn rw serve api`

      // Wait for the server to be ready
      let ready = false
      serverSubprocess.stdout?.on('data', (data) => {
        const text = Buffer.from(data).toString()
        if (text.includes('API listening on')) {
          ready = true
        }
      })
      while (!ready) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Run k6 test
      try {
        await execa('k6', ['run', path.join(TESTS_DIR, `${runForTests[i]}.js`)], {
          cwd: REDWOOD_PROJECT_DIRECTORY,
          stdio: 'inherit'
        })

        // TODO: Consider collecting the results into some summary output?
      } catch (_error) {
        console.warn('The k6 test failed')
      }

      // Stop the server
      serverSubprocess.kill("SIGINT")
      try {
        await serverSubprocess
      } catch (_error) {
        // ignore
      }
    }
  }

  process.emit('SIGINT')
}

main()
