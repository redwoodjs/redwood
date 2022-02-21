/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test'
import execa from 'execa'

import { waitForServer } from '../util'

// Declare worker fixtures.
type DevServerFixtures = {
  webServerPort: number
  apiServerPort: number
  server: any
}

// Note that we did not provide an test-scoped fixtures, so we pass {}.
const test = base.extend<any, DevServerFixtures>({
  webServerPort: [
    async ({}, use, workerInfo) => {
      // "port" fixture uses a unique value of the worker process index.
      await use(9000 + workerInfo.workerIndex)
    },
    { scope: 'worker' },
  ],
  apiServerPort: [
    async ({}, use, workerInfo) => {
      // "port" fixture uses a unique value of the worker process index.
      await use(9001 + workerInfo.workerIndex)
    },
    { scope: 'worker' },
  ],

  // "server" fixture starts automatically for every worker - we pass "auto" for that.
  server: [
    async ({ webServerPort, apiServerPort }, use) => {
      console.log('Starting dev server.....')

      const projectPath = process.env.PROJECT_PATH

      if (!projectPath) {
        throw new Error(
          'PROJECT_PATH env var not defined. Please build a test project, and re-run with PROJECT_PATH defined'
        )
      }

      console.log(`Launching dev server at ${projectPath}`)

      // Don't wait for this to finish, because it doens't
      const devServerHandler = execa.command(
        `yarn rw dev --fwd="--no-open" --no-generate`,
        {
          cwd: projectPath,
          shell: true,
          env: {
            WEB_DEV_PORT: webServerPort,
            API_DEV_PORT: apiServerPort,
          },
        }
      )

      // Pipe out logs so we can debug, when required
      devServerHandler.stdout.on('data', (data) => {
        console.log(
          '[devServer-fixture] ',
          Buffer.from(data, 'utf-8').toString()
        )
      })

      console.log('Waiting for dev servers.....')
      await waitForServer(webServerPort, 1000)
      await waitForServer(apiServerPort, 1000)

      console.log('Starting tests!')
      await use()
    },
    { scope: 'worker', auto: true },
  ],
})

export default test
