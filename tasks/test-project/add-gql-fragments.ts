/* eslint-env node, es6*/
import path from 'node:path'

import { hideBin } from 'yargs/helpers'
import yargs from 'yargs/yargs'

import { fragmentsTasks } from './tasks.js'

const args = yargs(hideBin(process.argv))
  .usage('Usage: $0 <project directory>')
  .parseSync()

/**
 * This script takes a regular test-project, and adds some extra files/config
 * so we can run e2e tests for fragments
 */
async function runCommand() {
  const OUTPUT_PROJECT_PATH = path.resolve(String(args._))
  const tasks = await fragmentsTasks(OUTPUT_PROJECT_PATH, {
    verbose: true,
  })

  tasks.run().catch((err: unknown) => {
    console.error(err)
    process.exit(1)
  })
}

runCommand()
