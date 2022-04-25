/* eslint-disable no-empty-pattern */
import { test as base } from '@playwright/test'
import execa from 'execa'

// Declare worker fixtures.
export type StorybookFixture = {
  port: number
  server: any
}

// Note that we did not provide an test-scoped fixtures, so we pass {}.
const test = base.extend<any, StorybookFixture>({
  port: [
    async ({}, use, workerInfo) => {
      // "port" fixture uses a unique value of the worker process index.
      await use(7910 + workerInfo.workerIndex)
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

      console.log(`Running rw storybook at ${projectPath}`)

      // Don't wait for this to finish, because it doens't
      const serverHandler = execa(
        `yarn rw storybook`,
        ['--port', port, '--no-open', '--ci'],
        {
          cwd: projectPath,
          shell: true,
          cleanup: true,
          detached: true,
        }
      )

      let serverReadyPromiseHandle

      const waitForSbServer = new Promise<boolean>((resolve, reject) => {
        serverReadyPromiseHandle = { resolve, reject }
      })

      // Pipe out logs so we can debug, when required
      serverHandler.stdout.on('data', (data) => {
        const outputAsString = Buffer.from(data, 'utf-8').toString()
        console.log('[rw-storybook-fixture]')

        if (outputAsString.includes('Local')) {
          serverReadyPromiseHandle.resolve()
        }
      })

      serverHandler.stdout.pipe(process.stdout)
      serverHandler.stderr.pipe(process.stderr)

      // serverHandler.stderr.on('data', (data) => {
      //   serverReadyPromiseHandle.reject()

      //   const outputAsString = Buffer.from(data, 'utf-8').toString()
      //   console.log('[rw-storybook-fixture] ', outputAsString)
      //   throw new Error('🚨 [ERR] Failed to start storybook server')
      // })

      console.log('Waiting for server.....')
      await waitForSbServer

      console.log('Starting tests!')
      await use()
    },
    { scope: 'worker', auto: true },
  ],
})

export default test
