/* eslint-env node */
// @ts-check

import fs from 'node:fs'
import path from 'node:path'

import { REDWOOD_FRAMEWORK_PATH, projectCopy, projectDeps } from '../actionsLib.mjs'

/**
 * @typedef {import('@actions/exec').ExecOptions} ExecOptions
 */

/**
 * @callback ExecInProject
 * @param {string} commandLine command to execute (can include additional args). Must be correctly escaped.
 * @param {Omit<ExecOptions, "cwd">=} options exec options.  See ExecOptions
 * @returns {Promise<unknown>} exit code
 */

/**
 * @param {string} rsaProjectPath
 * @param {Object} core
 * @param {(key: string, value: string) => void} core.setOutput
 * @param {ExecInProject} execInProject
 * @returns {Promise<void>}
 */
export async function main(
  rsaProjectPath,
  core,
  execInProject
) {
  core.setOutput('rsa-project-path', rsaProjectPath)

  console.log('rwPath', REDWOOD_FRAMEWORK_PATH)
  console.log('rsaProjectPath', rsaProjectPath)

  await setUpRsaTestProject(
    rsaProjectPath,
    execInProject,
  )
}

/**
 * @param {string} rsaProjectPath
 * @param {ExecInProject} execInProject
 * @returns {Promise<void>}
 */
async function setUpRsaTestProject(rsaProjectPath, execInProject) {
  const fixturePath = path.join(
    REDWOOD_FRAMEWORK_PATH,
    '__fixtures__',
    'test-project-rsa'
  )
  const rwBinPath = path.join(
    REDWOOD_FRAMEWORK_PATH,
    'packages/cli/dist/index.js'
  )
  const rwfwBinPath = path.join(
    REDWOOD_FRAMEWORK_PATH,
    'packages/cli/dist/rwfw.js'
  )

  console.log(`Creating project at ${rsaProjectPath}`)
  console.log()
  fs.cpSync(fixturePath, rsaProjectPath, { recursive: true })

  console.log(`Adding framework dependencies to ${rsaProjectPath}`)
  await projectDeps(rsaProjectPath)
  console.log()

  console.log(`Installing node_modules in ${rsaProjectPath}`)
  await execInProject('yarn install')

  console.log(`Building project in ${rsaProjectPath}`)
  await execInProject(`node ${rwBinPath} build -v`)
  console.log()

  console.log(`Copying over framework files to ${rsaProjectPath}`)
  await execInProject(`node ${rwfwBinPath} project:copy`, {
    env: { RWFW_PATH: REDWOOD_FRAMEWORK_PATH },
  })
  console.log()

  // await cache.saveCache([rsaProjectPath], dependenciesKey)
  // console.log(`Cache saved with key: ${dependenciesKey}`)
}

// async function setUpRsaFromFixture(
//   rsaProjectPath,
//   exec,
//   execInProject,
// ) {
//   const rwBinPath = path.join(
//     REDWOOD_FRAMEWORK_PATH,
//     'packages/cli/dist/index.js'
//   )
//   const rwfwBinPath = path.join(
//     REDWOOD_FRAMEWORK_PATH,
//     'packages/cli/dist/rwfw.js'
//   )

//   console.log(`Creating project at ${rsaProjectPath}`)
//   console.log()
//   await exec('npx', [
//     '-y',
//     'create-redwood-app@canary',
//     '-y',
//     '--no-git',
//     rscProjectPath,
//   ])

//   console.log(`Setting up Streaming/SSR in ${rscProjectPath}`)
//   const cmdSetupStreamingSSR = `node ${rwBinPath} experimental setup-streaming-ssr -f`
//   await execInProject(cmdSetupStreamingSSR)
//   console.log()

//   console.log(`Setting up RSC in ${rscProjectPath}`)
//   await execInProject(`node ${rwBinPath} experimental setup-rsc`)
//   console.log()

//   console.log(`Building project in ${rscProjectPath}`)
//   await execInProject(`node ${rwBinPath} build -v`)
//   console.log()

//   console.log(`Building project in ${rscProjectPath}`)
//   await execInProject(`node ${rwfwBinPath} project:copy`, {
//     env: { RWFW_PATH: REDWOOD_FRAMEWORK_PATH },
//   })
//   console.log()
// }
