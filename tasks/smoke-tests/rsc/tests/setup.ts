import * as os from 'os'
import * as path from 'path'

import { test as setup } from '@playwright/test'
// @ts-expect-error - With `* as` you have to use .default() when calling execa
import execa from 'execa'

import { projectData } from '../playwright.config'

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
        console.log('error', error)
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

  const rwPath = path.resolve(__dirname, '../../../..')
  console.log('rwPath', rwPath)

  // Using ./packages/create-redwood-app/dist/create-redwood-app.js doesn't
  // install the latest canary build
  // const cmd = `node ./packages/create-redwood-app/dist/create-redwood-app.js --yes ${projectOutputPath}`
  const cmd = `npx -y create-redwood-app@canary -y ${projectOutputPath}`

  await exec(cmd, getExecaOptions('/'))

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

async function build(projectOutputPath: string) {
  const rwPath = path.resolve(__dirname, '../../../..')
  const rwBinPath = path.join(rwPath, 'packages/cli/dist/index.js')

  const cmdBuild = `node ${rwBinPath} build -v`
  await exec(cmdBuild, getExecaOptions(projectOutputPath))
}

async function serve(projectOutputPath: string) {
  const rwPath = path.resolve(__dirname, '../../../..')
  const rwBinPath = path.join(rwPath, 'packages/cli/dist/index.js')

  const cmdBuild = `node ${rwBinPath} serve`
  return exec(cmdBuild, getExecaOptions(projectOutputPath))
}

setup('Setup and build test project', async () => {
  // Allow ample time for yarn to install everything
  setup.setTimeout(5 * 60 * 1000)

  const projectOutputPath = await createTestProject()
  await setupRsc(projectOutputPath)
  await build(projectOutputPath)
  const serveProcess = serve(projectOutputPath)
  projectData.serveProcess = serveProcess
})
