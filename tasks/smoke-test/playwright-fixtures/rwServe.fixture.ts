/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test'
import execa from 'execa'

import { projectNeedsBuilding, waitForServer } from '../util'

// Declare worker fixtures.
export type ServeFixture = {
  port: number
  server: any
}

// Note that we did not provide an test-scoped fixtures, so we pass {}.
const test = base.extend<any, ServeFixture>({
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
        console.log('Building project...')
        // skip rw build if its already done
        execa.sync(`yarn rw build`, {
          cwd: projectPath,
          shell: true,
          stdio: 'inherit',
        })
      }

      // Don't wait for this to finish, because it doesn't
      const serverHandler = execa.command(`yarn rw serve -p ${port}`, {
        cwd: projectPath,
        shell: true,
        detached: false,
      })

      if (!serverHandler) {
        throw new Error('Could not start test server')
      }

      // Pipe out logs so we can debug, when required
      serverHandler.stdout?.on('data', (data) => {
        console.log(
          '[rw-serve-fixture] ',
          Buffer.from(data, 'utf-8').toString()
        )
      })

      console.log('Waiting for server.....')
      await waitForServer(port, { host: '127.0.0.1' })

      console.log('Starting tests!')
      await use()
    },
    { scope: 'worker', auto: true },
  ],
})

export default test
