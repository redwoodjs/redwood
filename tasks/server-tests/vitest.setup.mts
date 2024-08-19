import { fileURLToPath } from 'node:url'

import { afterAll, afterEach, beforeAll, expect } from 'vitest'
import { fs, path, $ } from 'zx'
import type { ProcessPromise } from 'zx'

import { getConfig } from '@redwoodjs/project-config'

$.verbose = !!process.env.VERBOSE

type TestContext = {
  p?: ProcessPromise
  projectConfig: ReturnType<typeof getConfig>
}
export const testContext: TestContext = {
  // Casting here because `beforeAll` below sets this and this file runs before all tests.
  // Working around it being possibly undefined muddies the code in the tests.
  // Also can't just call `getConfig()` because RWJS_CWD hasn't been set yet
  projectConfig: {} as ReturnType<typeof getConfig>,
}

const __dirname = fileURLToPath(new URL('./', import.meta.url))
// @redwoodjs/cli (yarn rw)
export const rw = path.resolve(__dirname, '../../packages/cli/dist/index.js')
// @redwoodjs/api-server (yarn rw-server)
export const rwServer = path.resolve(
  __dirname,
  '../../packages/api-server/dist/bin.js',
)
// @redwoodjs/web-server (yarn rw-web-server)
export const rwWebServer = path.resolve(
  __dirname,
  '../../packages/web-server/dist/bin.js',
)

let original_RWJS_CWD
beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  const FIXTURE_PATH = fileURLToPath(
    new URL('./fixtures/redwood-app', import.meta.url),
  )
  process.env.RWJS_CWD = FIXTURE_PATH
  testContext.projectConfig = getConfig()

  // When running `yarn vitest run` to run all the test suites, log the bin paths only once.
  if (!globalThis.loggedBinPaths) {
    console.log(
      [
        'These tests use the following commands to run the server:',
        `• RWJS_CWD=${process.env.RWJS_CWD} yarn node ${rw} serve`,
        `• RWJS_CWD=${process.env.RWJS_CWD} yarn node ${rwServer}`,
        `• RWJS_CWD=${process.env.RWJS_CWD} yarn node ${rwWebServer}`,
      ].join('\n'),
    )
    globalThis.loggedBinPaths = true
  }
})
afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

// Clean up the child process after each test
afterEach(async () => {
  if (!testContext.p) {
    return
  }
  testContext.p.kill()
  // Wait for child process to terminate
  try {
    await testContext.p
  } catch {
    // Ignore
  }
})

export function sleep(time = 1_000) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

interface TestOptions {
  webHost?: string
  webPort?: number
  apiHost?: string
  apiPort?: number
  apiRootPath?: string
  projectConfig?: any
}

export async function test({
  webHost,
  webPort,
  apiHost,
  apiPort,
  apiRootPath,
}: TestOptions = {}) {
  webHost ??= '::'
  if (webHost.includes(':')) {
    webHost = `[${webHost}]`
  }
  webPort ??= testContext.projectConfig?.web.port

  const url = `http://${webHost}:${webPort}/about`

  for (let i = 0; i < 20; i++) {
    try {
      await fetch(url)
    } catch {
      await sleep(100)
    }
  }

  const webRes = await fetch(url)
  const webBody = await webRes.text()

  expect(webRes.status).toEqual(200)
  expect(webBody).toEqual(
    fs.readFileSync(
      path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
      'utf-8',
    ),
  )

  apiHost ??= '::'
  if (apiHost.includes(':')) {
    apiHost = `[${apiHost}]`
  }
  apiPort ??= testContext.projectConfig?.api.port
  apiRootPath ??= '/'
  apiRootPath = apiRootPath.charAt(0) === '/' ? apiRootPath : `/${apiRootPath}`
  apiRootPath =
    apiRootPath.charAt(apiRootPath.length - 1) === '/'
      ? apiRootPath
      : `${apiRootPath}/`

  const apiRes = await fetch(`http://${apiHost}:${apiPort}${apiRootPath}hello`)
  const apiBody = await apiRes.json()

  expect(apiRes.status).toEqual(200)
  expect(apiBody).toEqual({ data: 'hello function' })

  const apiProxyRes = await fetch(
    `http://${webHost}:${webPort}${testContext.projectConfig.web.apiUrl}/hello`,
  )
  const apiProxyBody = await apiProxyRes.json()

  expect(apiProxyRes.status).toEqual(200)
  expect(apiProxyBody).toEqual({ data: 'hello function' })
}
