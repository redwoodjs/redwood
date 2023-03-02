/* eslint-disable no-empty-pattern */
import { Transform } from 'stream'

import { test as base } from '@playwright/test'
import execa from 'execa'
import isPortReachable from 'is-port-reachable'

// Declare worker fixtures.
export type StorybookFixture = {
  port: number
  server: string
}

// Note that we did not provide an test-scoped fixtures, so we pass {}.
const test = base.extend<any, StorybookFixture>({
  port: [
    async ({}, use) => {
      await use(7980)
    },
    { scope: 'worker' },
  ],

  // "server" fixture starts automatically for every worker - we pass "auto" for that.
  server: [
    async ({ port }, use) => {
      console.log('Starting storybook server.....')

      const projectPath = process.env.PROJECT_PATH

      if (!projectPath) {
        throw new Error(
          'PROJECT_PATH env var not defined. Please build a test project, and re-run with PROJECT_PATH defined'
        )
      }

      console.log(`Running rw storybook at ${projectPath}`)

      const isServerAlreadyUp = await isPortReachable(port, {
        timeout: 5000,
      })

      if (isServerAlreadyUp) {
        console.log('Reusing existing SB server....')
        console.log({
          port,
        })
      } else {
        // Don't wait for this to finish, because it doens't
        const serverHandler = execa(
          `yarn rw storybook`,
          ['--port', port, '--no-open', '--ci'],
          {
            cwd: projectPath,
            shell: true,
            cleanup: true,
            detached: false,
          }
        )

        let serverReadyPromiseHandle

        const waitForSbServer = new Promise<boolean>((resolve, reject) => {
          serverReadyPromiseHandle = { resolve, reject }
        })

        // Pipe out logs so we can debug, when required
        serverHandler.stdout.on('data', (data) => {
          const outputAsString = Buffer.from(data, 'utf-8').toString()
          console.log('[rw-storybook-fixture]', outputAsString)

          if (outputAsString.includes(`http://localhost:${port}/`)) {
            serverReadyPromiseHandle.resolve()
          }
        })

        // Quick transform stream to prevent webpack output flooding the logs
        const removeWebpackOutput = new Transform({
          transform(chunk, encoding, callback) {
            callback(null, '')
          },
        })

        // @NOTE: For some reason we need to do this
        // Because otherwise the server doesn't launch correctly
        serverHandler.stdout.pipe(removeWebpackOutput).pipe(process.stdout)
        serverHandler.stderr.pipe(removeWebpackOutput).pipe(process.stderr)

        console.log('Waiting for server.....')
        await waitForSbServer
      }

      console.log('Starting tests!')
      await use(`Server ready at ${port}`)
    },
    { scope: 'worker', auto: true },
  ],
})

export default test
