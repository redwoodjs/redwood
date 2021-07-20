import { test as base } from '@playwright/test'
import execa from 'execa'

import { waitForServer } from './util'

// Declare worker fixtures.
type DevServerFixtures = {
  port: number
  server: any
}

// Note that we did not provide an test-scoped fixtures, so we pass {}.
const test = base.extend<{}, DevServerFixtures>({
  port: [
    async ({}, use, workerInfo) => {
      // "port" fixture uses a unique value of the worker process index.
      await use(8910 + workerInfo.workerIndex)
    },
    { scope: 'worker' },
  ],

  // "server" fixture starts automatically for every worker - we pass "auto" for that.
  server: [
    async ({ port }, use) => {
      // Setup express app.
      console.log('Starting dev server.....')

      const projectPath = process.env.PROJECT_PATH

      if (!projectPath) {
        throw new Error(
          'PROJECT_PATH not defined. Need this to launch the dev server'
        )
      }

      console.log(`Launching dev server at ${projectPath}`)

      // Don't wait for this to finish, because it doens't
      const devServerHandler = execa.command(
        `yarn rw dev --fwd="--port=${port}" --no-generate`,
        {
          cwd: projectPath,
          shell: true,
        }
      )

      // So we can see the dev server logs too
      devServerHandler.stdout.pipe(process.stdout)

      console.log('Waiting for dev server.....')
      const devServerReady = await waitForServer(port, 1000)

      console.log('Starting tests!')
      await use(devServerReady)

      // TODO cleanup if we need to
    },
    { scope: 'worker', auto: true },
  ],
})

export default test
