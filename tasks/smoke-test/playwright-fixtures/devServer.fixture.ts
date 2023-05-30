/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test'
import chalk from 'chalk'
import execa, { ExecaChildProcess } from 'execa'
import isPortReachable from 'is-port-reachable'

import { shutdownPort } from '@redwoodjs/internal/dist/dev'

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

      const serversUp = await Promise.all([
        isPortReachable(webServerPort, {
          timeout: 5000,
        }),
        isPortReachable(apiServerPort, {
          timeout: 5000,
        }),
      ])

      if (serversUp.some((server) => server === true)) {
        console.log('Found previous instances of dev server. Killing 🪓!')

        shutdownPort(webServerPort)
        shutdownPort(apiServerPort)
      }

      let devServerHandler: ExecaChildProcess | null = null

      console.log(`Launching dev server at ${projectPath}`)

      // Don't wait for this to finish, because it doesn't
      devServerHandler = execa(`yarn rw dev --no-generate --fwd="--no-open"`, {
        cwd: projectPath,
        shell: true,
        detached: false,
        env: {
          WEB_DEV_PORT: webServerPort,
          API_DEV_PORT: apiServerPort,
        },
        cleanup: true,
      })

      // Pipe out logs so we can debug, when required
      devServerHandler.stdout?.on('data', (data) => {
        console.log(
          '[devServer-fixture]',
          Buffer.from(data, 'utf-8').toString()
        )
      })
      devServerHandler.stderr?.on('data', (data) => {
        console.log(
          chalk.bgRed('[devServer-fixture]'),
          Buffer.from(data, 'utf-8').toString()
        )

        throw new Error(
          `Error starting server: ${Buffer.from(data, 'utf-8').toString()}`
        )
      })

      console.log('Waiting for dev servers.....')
      await waitForServer(webServerPort)
      await waitForServer(apiServerPort)

      console.log('Starting tests!')

      await use()

      // Make sure the dev server is killed after all tests are done.
      // Re-using could be more efficient, but it seems to cause inconsistency
      // It seems our Vite server gets killed after a run, but the API server does not
      if (devServerHandler) {
        console.log('Test complete. Killing dev servers 🪓')
        devServerHandler?.kill()
        shutdownPort(webServerPort)
        shutdownPort(apiServerPort)
      }
    },
    { scope: 'worker', auto: true },
  ],
})

export default test
