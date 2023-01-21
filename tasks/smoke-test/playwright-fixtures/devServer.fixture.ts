/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test'
import execa, { ExecaChildProcess } from 'execa'
import isPortReachable from 'is-port-reachable'

import { waitForServer } from '../util'

// Declare worker fixtures.
export type DevServerFixtures = {
  webServerPort: number
  apiServerPort: number
  server: any
  webUrl: string
}

// Note that we did not provide an test-scoped fixtures, so we pass {}.
const test = base.extend<any, DevServerFixtures>({
  webServerPort: [
    async ({}, use) => {
      // "port" fixture uses a unique value of the worker process index.
      await use(9000)
    },
    { scope: 'worker' },
  ],
  apiServerPort: [
    async ({}, use) => {
      await use(9001)
    },
    { scope: 'worker' },
  ],
  webUrl: [
    async ({ webServerPort }, use) => {
      await use(`localhost:${webServerPort}`)
    },
    { scope: 'worker' },
  ],

  // "server" fixture starts automatically for every worker - we pass "auto" for that.
  server: [
    async ({ webServerPort, apiServerPort }, use) => {
      const projectPath = process.env.PROJECT_PATH

      if (!projectPath) {
        throw new Error(
          'PROJECT_PATH env var not defined. Please build a test project, and re-run with PROJECT_PATH defined'
        )
      }

      const isServerAlreadyUp = await isPortReachable(webServerPort, {
        timeout: 5000,
      })

      let devServerHandler: ExecaChildProcess

      if (isServerAlreadyUp) {
        console.log('Reusing server....')
        console.log({
          webServerPort,
          apiServerPort,
        })
      } else {
        console.log(`Launching dev server at ${projectPath}`)

        // Don't wait for this to finish, because it doens't
        devServerHandler = execa(
          `yarn rw dev --fwd="--no-open" --no-generate`,
          {
            cwd: projectPath,
            shell: true,
            detached: false,
            env: {
              WEB_DEV_PORT: webServerPort,
              API_DEV_PORT: apiServerPort,
            },
            cleanup: true,
          }
        )

        // Pipe out logs so we can debug, when required
        devServerHandler.stdout.on('data', (data) => {
          console.log(
            '[devServer-fixture] ',
            Buffer.from(data, 'utf-8').toString()
          )
        })
      }

      console.log('Waiting for dev servers.....')
      await waitForServer(webServerPort)
      await waitForServer(apiServerPort)

      console.log('Starting tests!')

      await use()
    },
    { scope: 'worker', auto: true },
  ],
})

export default test
