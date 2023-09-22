/* eslint-env node */
// @ts-check

import path from 'node:path'
import { REDWOOD_FRAMEWORK_PATH } from '../actionsLib.mjs'

/**
 * @param {string} rscProjectPath
 * @param {Object} core
 * @param {(key: string, value: string) => void} core.setOutput
 * @param {string} dependenciesKey
 * @param {string} distKey
 * @param {Object} cache
 * @param {(paths: Array<string>, distKey: string) => Promise<number>} cache.saveCache
 * @param {(paths: Array<string>, distKey: string) => Promise<string | undefined>} cache.restoreCache
 * @param {Object} exec
 * @param {(command: string) => Promise<unknown>} execInProject
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

/**
 * @param {string} rscProjectPath
 * @param {Object} cache
 * @param {(paths: Array<string>, distKey: string) => Promise<number>} cache.saveCache
 * @param {(file: string, args: Array<string>) => Promise<unknown>} exec
 * @param {(command: string) => Promise<unknown>} execInProject
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
  const rwBinPath = path.join(REDWOOD_FRAMEWORK_PATH, 'packages/cli/dist/index.js')

  console.log(`Creating project at ${rscProjectPath}`)
  console.log()
  await exec('npx', ['-y', 'create-redwood-app@canary', '-y', '--no-git', rscProjectPath])

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

  await cache.saveCache([rscProjectPath], dependenciesKey)
  console.log(`Cache saved with key: ${dependenciesKey}`)
}
