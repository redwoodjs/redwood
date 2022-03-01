/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test'
import execa from 'execa'
import { pathExistsSync } from 'fs-extra'
import path from 'node:path'

import { waitForServer } from '../util'

// Declare worker fixtures.
type DevServerFixtures = {
  port: number
  server: any
}

// Note that we did not provide an test-scoped fixtures, so we pass {}.
const test = base.extend<any, DevServerFixtures>({
  port: [
    async ({}, use, workerInfo) => {
      // "port" fixture uses a unique value of the worker process index.
      await use(8899 + workerInfo.workerIndex)
    },
    { scope: 'worker' },
  ],

  // "server" fixture starts automatically for every worker - we pass "auto" for that.
  server: [
    async ({ port }, use) => {
      console.log('Starting rw server.....')

      const projectPath = process.env.PROJECT_PATH

      if (!projectPath) {
        throw new Error(
          'PROJECT_PATH env var not defined. Please build a test project, and re-run with PROJECT_PATH defined'
        )
      }

      console.log(`Running rw serve at ${projectPath}`)

      if (projectNeedsBuilding(projectPath)) {
        // skip rw build if its already done
        execa.sync(`yarn rw build`, {
          cwd: projectPath,
          shell: true,
        })
      }

      // Don't wait for this to finish, because it doens't
      const rwServeHandler = execa.command(`yarn rw serve -p ${port}`, {
        cwd: projectPath,
        shell: true,
      })

      // Pipe out logs so we can debug, when required
      rwServeHandler.stdout.on('data', (data) => {
        console.log(
          '[rw-serve-fixture] ',
          Buffer.from(data, 'utf-8').toString()
        )
      })

      console.log('Waiting for server.....')
      await waitForServer(port, 1000)

      console.log('Starting tests!')
      await use()
    },
    { scope: 'worker', auto: true },
  ],
})

const projectNeedsBuilding = (
  projectPath: string = process.env.PROJECT_PATH
) => {
  const webDist = path.join(projectPath, 'web/dist')
  const apiDist = path.join(projectPath, 'api/dist')
  return !(pathExistsSync(webDist) && pathExistsSync(apiDist))
}

export default test
