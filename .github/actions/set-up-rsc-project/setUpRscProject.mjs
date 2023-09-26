/* eslint-env node */
// @ts-check

import path from 'node:path'

import { REDWOOD_FRAMEWORK_PATH } from '../actionsLib.mjs'

/**
 * @typedef {import('@actions/exec').ExecOptions} ExecOptions
 */

/**
 * Exec a command.
 * Output will be streamed to the live console.
 * Returns promise with return code
 *
 * @callback Exec
 * @param {string} commandLine command to execute (can include additional args). Must be correctly escaped.
 * @param {string[]=} args arguments for tool. Escaping is handled by the lib.
 * @param {ExecOptions=} options exec options.  See ExecOptions
 * @returns {Promise<unknown>} exit code
 */

/**
 * @callback ExecInProject
 * @param {string} commandLine command to execute (can include additional args). Must be correctly escaped.
 * @param {Omit<ExecOptions, "cwd">=} options exec options.  See ExecOptions
 * @returns {Promise<unknown>} exit code
 */

/**
 * @param {string} rscProjectPath
 * @param {Object} core
 * @param {(key: string, value: string) => void} core.setOutput
 * @param {string} dependenciesKey
 * @param {string} distKey
 * @param {Object} cache
 * @param {(paths: Array<string>, distKey: string) => Promise<number>} cache.saveCache
 * @param {(paths: Array<string>, distKey: string) => Promise<string | undefined>} cache.restoreCache
 * @param {Exec} exec
 * @param {ExecInProject} execInProject
 * @returns {Promise<void>}
 */
export async function main(
  rscProjectPath,
  core,
  dependenciesKey,
  distKey,
  cache,
  exec,
  execInProject
) {
  core.setOutput('rsc-project-path', rscProjectPath)

  console.log('rwPath', REDWOOD_FRAMEWORK_PATH)
  console.log('rscProjectPath', rscProjectPath)

  if (Math.random() > 5) {
    const distCacheKey = await cache.restoreCache([rscProjectPath], distKey)

    if (distCacheKey) {
      console.log(`Cache restored from key: ${distKey}`)
      return
    }

    const dependenciesCacheKey = await cache.restoreCache(
      [rscProjectPath],
      dependenciesKey
    )

    if (dependenciesCacheKey) {
      console.log('Cache restored from key:', dependenciesKey)
    } else {
      console.log('Cache not found for input keys:', distKey, dependenciesKey)
      await setUpRscProject(
        rscProjectPath,
        cache,
        exec,
        execInProject,
        dependenciesKey
      )
    }

    await cache.saveCache([rscProjectPath], distKey)
    console.log(`Cache saved with key: ${distKey}`)
  }

  await setUpRscProject(
    rscProjectPath,
    cache,
    exec,
    execInProject,
    dependenciesKey
  )
}

/**
 * @param {string} rscProjectPath
 * @param {Object} cache
 * @param {(paths: Array<string>, distKey: string) => Promise<number>} cache.saveCache
 * @param {Exec} exec
 * @param {ExecInProject} execInProject
 * @param {string} dependenciesKey
 * @returns {Promise<void>}
 */
async function setUpRscProject(
  rscProjectPath,
  cache,
  exec,
  execInProject,
  dependenciesKey
) {
  const rwBinPath = path.join(
    REDWOOD_FRAMEWORK_PATH,
    'packages/cli/dist/index.js'
  )
  const rwfwBinPath = path.join(
    REDWOOD_FRAMEWORK_PATH,
    'packages/cli/dist/rwfw.js'
  )

  console.log(`Creating project at ${rscProjectPath}`)
  console.log()
  await exec('npx', [
    '-y',
    'create-redwood-app@canary',
    '-y',
    '--no-git',
    rscProjectPath,
  ])

  console.log(`Setting up Streaming/SSR in ${rscProjectPath}`)
  const cmdSetupStreamingSSR = `node ${rwBinPath} experimental setup-streaming-ssr -f`
  await execInProject(cmdSetupStreamingSSR)
  console.log()

  console.log(`Setting up RSC in ${rscProjectPath}`)
  await execInProject(`node ${rwBinPath} experimental setup-rsc`)
  console.log()

  console.log(`Building project in ${rscProjectPath}`)
  await execInProject(`node ${rwBinPath} build -v`)
  console.log()

  console.log(`Building project in ${rscProjectPath}`)
  await execInProject(`node ${rwfwBinPath} project:copy`, {
    env: { RWFW_PATH: REDWOOD_FRAMEWORK_PATH },
  })
  console.log()

  await cache.saveCache([rscProjectPath], dependenciesKey)
  console.log(`Cache saved with key: ${dependenciesKey}`)
}
