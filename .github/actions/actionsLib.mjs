/* eslint-env node */
// @ts-check

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getExecOutput } from '@actions/exec'
import { hashFiles } from '@actions/glob'

/**
 * @typedef {import('@actions/exec').ExecOptions} ExecOptions
 */

export const REDWOOD_FRAMEWORK_PATH = fileURLToPath(new URL('../../', import.meta.url))

/**
 * @param {string} command
 * @param {ExecOptions} options
 */
function execWithEnv(command, { env = {}, ...rest } = {}) {
  return getExecOutput(
    command,
    undefined,
    {
      env: {
        ...process.env,
        ...env
      },
      ...rest
    }
  )
}

/**
 * @param {string} cwd
 */
export function createExecWithEnvInCwd(cwd) {
  /**
   * @param {string} command
   * @param {Omit<ExecOptions, 'cwd'>} options
   */
  return function (command, options = {}) {
    return execWithEnv(command, { cwd, ...options })
  }
}

export const execInFramework = createExecWithEnvInCwd(REDWOOD_FRAMEWORK_PATH)

/**
 * @param {string} redwoodProjectCwd
 */
export function projectDeps(redwoodProjectCwd) {
  return execInFramework('yarn project:deps', { env: { RWJS_CWD: redwoodProjectCwd } })
}

/**
 * @param {string} redwoodProjectCwd
 */
export function projectCopy(redwoodProjectCwd) {
  return execInFramework('yarn project:copy', { env: { RWJS_CWD: redwoodProjectCwd } })
}

/**
 * @param {{ baseKeyPrefix: string, distKeyPrefix: string }} options
 */
export async function createCacheKeys({ baseKeyPrefix, distKeyPrefix }) {
  const baseKey = [
    baseKeyPrefix,
    process.env.RUNNER_OS,
    process.env.GITHUB_REF.replaceAll('/', '-'),
    await hashFiles(path.join('__fixtures__', 'test-project'))
  ].join('-')

  const dependenciesKey = [
    baseKey,
    'dependencies',
    await hashFiles(['yarn.lock', '.yarnrc.yml'].join('\n')),
  ].join('-')

  const distKey = [
    dependenciesKey,
    distKeyPrefix,
    'dist',
    await hashFiles([
      'package.json',
      'babel.config.js',
      'tsconfig.json',
      'tsconfig.compilerOption.json',
      'nx.json',
      'lerna.json',
      'packages',
    ].join('\n'))
  ].join('-')

  return {
    baseKey,
    dependenciesKey,
    distKey
  }
}
