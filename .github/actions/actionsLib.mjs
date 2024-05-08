/* eslint-env node */
// @ts-check

import fs from 'node:fs'
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
 * @param {{ baseKeyPrefix: string, distKeyPrefix: string, canary: boolean }} options
 */
export async function createCacheKeys({ baseKeyPrefix, distKeyPrefix, canary }) {
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
  ].join('-') + (canary ? '-canary' : '')

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
  ].join('-') + (canary ? '-canary' : '')

  return {
    baseKey,
    dependenciesKey,
    distKey
  }
}

/**
 * @callback ExecInProject
 * @param {string} commandLine command to execute (can include additional args). Must be correctly escaped.
 * @param {Omit<ExecOptions, "cwd">=} options exec options.  See ExecOptions
 * @returns {Promise<unknown>} exit code
 */

/**
 * @param {string} testProjectPath
 * @param {string} fixtureName
 * @param {Object} core
 * @param {(key: string, value: string) => void} core.setOutput
 * @param {ExecInProject} execInProject
 * @returns {Promise<void>}
 */
export async function setUpRscTestProject(
  testProjectPath,
  fixtureName,
  core,
  execInProject
) {
  core.setOutput('test-project-path', testProjectPath)

  console.log('rwPath', REDWOOD_FRAMEWORK_PATH)
  console.log('testProjectPath', testProjectPath)

  const fixturePath = path.join(
    REDWOOD_FRAMEWORK_PATH,
    '__fixtures__',
    fixtureName
  )
  const rwBinPath = path.join(
    REDWOOD_FRAMEWORK_PATH,
    'packages/cli/dist/index.js'
  )
  const rwfwBinPath = path.join(
    REDWOOD_FRAMEWORK_PATH,
    'packages/cli/dist/rwfw.js'
  )

  console.log(`Creating project at ${testProjectPath}`)
  console.log()
  fs.cpSync(fixturePath, testProjectPath, { recursive: true })

  console.log('Syncing framework')
  await execInProject(`node ${rwfwBinPath} project:tarsync --verbose`, {
    env: { RWFW_PATH: REDWOOD_FRAMEWORK_PATH },
  })
  console.log()

  console.log(`Building project in ${testProjectPath}`)
  await execInProject(`node ${rwBinPath} build -v`)
  console.log()
}
