/* eslint-env node */
// @ts-check

import os from 'node:os'
import path from 'node:path'

import execa from 'execa'

import { main } from './setUpRscProject.mjs'

class ExecaError extends Error {
  stdout
  stderr
  exitCode

  constructor({ stdout, stderr, exitCode }) {
    super(`execa failed with exit code ${exitCode}`)
    this.stdout = stdout
    this.stderr = stderr
    this.exitCode = exitCode
  }
}

/**
 * @template [EncodingType=string]
 * @typedef {import('execa').Options<EncodingType>} ExecaOptions<T>
 */

/**
 * @param  {...any} cmd
 */
async function exec(...cmd) {
  // @ts-expect-error - The types needs fixing
  return execa(...cmd)
    .then(({ stdout, stderr, exitCode }) => {
      if (exitCode !== 0) {
        throw new ExecaError({ stdout, stderr, exitCode })
      }
    })
    .catch((error) => {
      if (error instanceof ExecaError) {
        // Rethrow ExecaError
        throw error
      } else {
        const { stdout, stderr, exitCode } = error
        console.log('error', error)
        throw new ExecaError({ stdout, stderr, exitCode })
      }
    })
}

/**
 * @param {string} cwd
 * @returns {ExecaOptions<string>}
 */
function getExecaOptions(cwd) {
  return {
    shell: true,
    stdio: 'inherit',
    cleanup: true,
    cwd,
  }
}

const rscProjectPath = path.join(
  os.tmpdir(),
  'rsc-project',
  // ":" is problematic with paths
  new Date().toISOString().split(':').join('-')
)

// Mock for @actions/core
const core = {
  setOutput: () => {},
}

// Mock for @actions/cache
const cache = {
  saveCache: async () => 1,
  restoreCache: async () => undefined,
}

const dependenciesKey = 'rsc-project-dependency-key'
const distKey = 'rsc-dist-key'

/**
 * @param  {...any} cmd
 */
const execInProject = (...cmd) => {
  return exec(...cmd, getExecaOptions(rscProjectPath))
}

/**
 * @param  {...any} cmd
 */
const execInRoot = (...cmd) => {
  return exec(...cmd, getExecaOptions('/'))
}

main(
  rscProjectPath,
  core,
  dependenciesKey,
  distKey,
  cache,
  execInRoot,
  execInProject
)
