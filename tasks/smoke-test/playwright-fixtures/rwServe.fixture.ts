/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test'
import execa from 'execa'

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
          'PROJECT_PATH not defined. Need this to launch the dev server'
        )
      }

      console.log(`Building project at ${projectPath}`)

      // @TODO build should be the step before running smoke test
      // execa.sync('yarn rw build', {
      //   cwd: projectPath,
      //   shell: true,
      // })

      // Don't wait for this to finish, because it doens't
      const rwServeHandler = execa.command(`yarn rw serve -p ${port}`, {
        cwd: projectPath,
        shell: true,
      })

      // So we can see the dev server logs too
      rwServeHandler.stdout.pipe(process.stdout)

      console.log('Waiting for dev servers.....')
      await waitForServer(port, 1000)

      console.log('Starting tests!')
      await use(true) // we just set true here, because we don't actually care about this fixture
    },
    { scope: 'worker', auto: true },
  ],
})

export default test
