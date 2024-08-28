/* eslint-env node */
// @ts-check

import path from 'node:path'

import core from '@actions/core'

import fs from 'fs-extra'

import {
  createExecWithEnvInCwd,
  execInFramework,
  REDWOOD_FRAMEWORK_PATH,
} from '../actionsLib.mjs'

const TEST_PROJECT_PATH = path.join(path.dirname(process.cwd()), 'test-project')

core.setOutput('test-project-path', TEST_PROJECT_PATH)

const canary = core.getInput('canary') === 'true'
console.log({
  canary,
})

console.log()

/**
 * @returns {Promise<void>}
 */
async function main() {
  await setUpTestProject({
    canary: true,
  })
}

/**
 *  *@param {{canary: boolean}} options
 * @returns {Promise<void>}
 */
async function setUpTestProject({ canary }) {
  const TEST_PROJECT_FIXTURE_PATH = path.join(
    REDWOOD_FRAMEWORK_PATH,
    '__fixtures__',
    'test-project',
  )

  console.log(`Creating project at ${TEST_PROJECT_PATH}`)
  console.log()
  await fs.copy(TEST_PROJECT_FIXTURE_PATH, TEST_PROJECT_PATH)

  await execInFramework('yarn project:tarsync --verbose', {
    env: { RWJS_CWD: TEST_PROJECT_PATH },
  })

  if (canary) {
    console.log(`Upgrading project to canary`)
    await execInProject('yarn rw upgrade -t canary')
    console.log()
  }

  await sharedTasks()
}

const execInProject = createExecWithEnvInCwd(TEST_PROJECT_PATH)

/**
 * @returns {Promise<void>}
 */
async function sharedTasks() {
  console.log('Generating dbAuth secret')
  const { stdout } = await execInProject('yarn rw g secret --raw', {
    silent: true,
  })
  fs.appendFileSync(
    path.join(TEST_PROJECT_PATH, '.env'),
    `SESSION_SECRET='${stdout}'`,
  )
  console.log()

  console.log('Running prisma migrate reset')
  await execInProject('yarn rw prisma migrate reset --force')
}

main()
