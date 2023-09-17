import * as os from 'os'
import * as path from 'path'

import { test, expect } from '@playwright/test'
// @ts-expect-error - With `* as` you have to use .default() when calling execa
import execa from 'execa'

class ExecaError extends Error {
  stdout: string
  stderr: string
  exitCode: number

  constructor({
    stdout,
    stderr,
    exitCode,
  }: {
    stdout: string
    stderr: string
    exitCode: number
  }) {
    super(`execa failed with exit code ${exitCode}`)
    this.stdout = stdout
    this.stderr = stderr
    this.exitCode = exitCode
  }
}

async function exec(...args: [file: string, options: execa.Options<string>]) {
  return execa(...args)
    .then(({ stdout, stderr, exitCode }) => {
      if (exitCode !== 0) {
        throw new ExecaError({ stdout, stderr, exitCode })
      }
    })
    .catch((error) => {
      if (error instanceof ExecaError) {
        // Rethrow ExecaError
        throw error
      } else {
        const { stdout, stderr, exitCode } = error
        throw new ExecaError({ stdout, stderr, exitCode })
      }
    })
}

function getExecaOptions(cwd: string): execa.Options<string> {
  return {
    shell: true,
    stdio: 'pipe',
    cleanup: true,
    cwd,
  }
}

async function createTestProject() {
  const projectOutputPath = path.join(
    os.tmpdir(),
    'redwood-test-project-rsc',
    // ":" is problematic with paths
    new Date().toISOString().split(':').join('-')
  )

  console.log('__dirname', __dirname)
  const rwPath = path.resolve(__dirname, '../../../..')
  console.log('rwPath', rwPath)

  const cmd = `node ./packages/create-redwood-app/dist/create-redwood-app.js --yes ${projectOutputPath}`

  await exec(cmd, getExecaOptions(rwPath))

  return projectOutputPath
}

async function setupRsc(projectOutputPath: string) {
  const rwPath = path.resolve(__dirname, '../../../..')
  const rwBinPath = path.join(rwPath, 'packages/cli/dist/index.js')

  const cmdSetupStreamingSSR = `node ${rwBinPath} experimental setup-streaming-ssr -f`
  await exec(cmdSetupStreamingSSR, getExecaOptions(projectOutputPath))

  const cmdSetupRSC = `node ${rwBinPath} experimental setup-rsc`
  await exec(cmdSetupRSC, getExecaOptions(projectOutputPath))
}

test('Setting up RSC should give you a test project with a client side counter component', async ({
  page,
}) => {
  const projectOutputPath = await createTestProject()
  await setupRsc(projectOutputPath)

  await page.goto('/')

  const h3 = await page.locator('h3').first().innerHTML()
  expect(h3).toMatch(/This is a server component/)
  await page.locator('p').filter({ hasText: 'Count: 0' }).first().isVisible()

  await page.locator('button').filter({ hasText: 'Increment' }).click()

  const count = await page.locator('p').first().innerText()
  expect(count).toMatch(/Count: 1/)

  page.close()
})
