import { fileURLToPath } from 'node:url'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { fs, path, $ } from 'zx'

import { getConfig } from '@redwoodjs/project-config'
import { sleep } from './helpers.mjs'

//////////
// Setup
//////////

$.verbose = !!process.env.VERBOSE

const __dirname = fileURLToPath(new URL('./', import.meta.url))
const FIXTURE_PATH = fileURLToPath(
  new URL('./fixtures/redwood-app', import.meta.url)
)

// @redwoodjs/cli (yarn rw)
const rw = path.resolve(__dirname, '../../packages/cli/dist/index.js')
// @redwoodjs/api-server (yarn rw-server)
const rwServer = path.resolve(
  __dirname,
  '../../packages/api-server/dist/bin.js'
)
// @redwoodjs/web-server (yarn rw-web-server)
const rwWebServer = path.resolve(
  __dirname,
  '../../packages/web-server/dist/bin.js'
)

let original_RWJS_CWD
let projectConfig
beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = FIXTURE_PATH
  projectConfig = getConfig()
  console.log([
    'These tests use the following command to run the server:',
    `• RWJS_CWD=${process.env.RWJS_CWD} yarn node ${rw} serve`,
    `• RWJS_CWD=${process.env.RWJS_CWD} yarn node ${rwServer}`,
    `• RWJS_CWD=${process.env.RWJS_CWD} yarn node ${rwWebServer}`,
  ].join('\n'))
})
afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

// Clean up the child process after each test
let p
afterEach(async () => {
  if (!p) {
    return
  }
  p.kill()
  // Wait for child process to terminate
  try {
    await p
  } catch {
    // Ignore
  }
})

const TIMEOUT = 1_000 * 2

//////////
// Tests
//////////

describe.each([
  [[rw, 'serve']],
  [rwServer],
])('serve both (%s)', (cmd) => {
  it("has help configured", async () => {
    const { stdout } = await $`yarn node ${cmd} --help`
    expect(stdout).toMatchSnapshot()
  })

  it('errors out on unknown args', async () => {
    try {
      await $`yarn node ${cmd} --foo --bar --baz`
      expect(true).toEqual(false)
    } catch (p) {
      expect(p.exitCode).toEqual(1)
      expect(p.stdout).toEqual('')
      expect(p.stderr).toMatchSnapshot()
    }
  })

  describe('webPort', () => {
    it("`--webPort` changes the web server's port", async () => {
      const webPort = 8920
      p = $`yarn node ${cmd} --webPort ${webPort}`
      await sleep(TIMEOUT)
      await test({ webPort })
    })

    it("`REDWOOD_WEB_PORT` changes the web server's port", async () => {
      process.env.REDWOOD_WEB_PORT = '8921'
      const webPort = +process.env.REDWOOD_WEB_PORT
      p = $`yarn node ${cmd}`
      await sleep(TIMEOUT)
      await test({ webPort })
      delete process.env.REDWOOD_WEB_PORT
    })

    it('`--webPort` takes precedence over `REDWOOD_WEB_PORT`', async () => {
      const webPort = 8922
      process.env.REDWOOD_WEB_PORT = '8923'
      p = $`yarn node ${cmd} --webPort ${webPort}`
      await sleep(TIMEOUT)
      await test({ webPort })
      delete process.env.REDWOOD_WEB_PORT
    })

    it('`[web].port` changes the port', async () => {
      p = $`yarn node ${cmd}`
      await sleep(TIMEOUT)
      await test({ port: projectConfig.web.port })
    })
  })

  describe('webHost', () => {
    it("`--webHost` changes the web server's host", async () => {
      const webHost = '127.0.0.1'
      p = $`yarn node ${cmd} --webHost ${webHost}`
      await sleep(TIMEOUT)
      await test({ webHost })
    })

    it("`REDWOOD_WEB_HOST` changes the web server's host", async () => {
      process.env.REDWOOD_WEB_HOST = '::1'
      const webHost = process.env.REDWOOD_WEB_HOST
      p = $`yarn node ${cmd}`
      await sleep(TIMEOUT)
      await test({ webHost })
      delete process.env.REDWOOD_WEB_HOST
    })

    it('`--webHost` takes precedence over `REDWOOD_WEB_HOST`', async () => {
      const webHost = '::'
      process.env.REDWOOD_WEB_HOST = '0.0.0.0'
      p = $`yarn node ${cmd} --webHost ${webHost}`
      await sleep(TIMEOUT)
      await test({ webHost })
      delete process.env.REDWOOD_WEB_HOST
    })

    it.todo('`[web].host` changes the host')

    it("defaults to '::' if `NODE_ENV` isn't production", async () => {
      p = $`yarn node ${cmd}`
      await sleep(TIMEOUT)
      await test()
    })

    it.todo("defaults to '0.0.0.0' if `NODE_ENV` is production")
  })
})

async function test(options = {}) {
  options.webHost ??= '::'
  if (options.webHost.includes(':')) {
    options.webHost = `[${options.webHost}]`
  }
  options.webPort ??= projectConfig.web.port

  const webRes = await fetch(`http://${options.webHost}:${options.webPort}/about`)
  const webBody = await webRes.text()

  expect(webRes.status).toEqual(200)
  expect(webBody).toEqual(
    fs.readFileSync(
      path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
      'utf-8'
    )
  )

  options.apiHost ??= '::'
  if (options.apiHost.includes(':')) {
    options.apiHost = `[${options.apiHost}]`
  }
  options.apiPort ??= projectConfig.api.port

  const apiRes = await fetch(`http://${options.apiHost}:${options.apiPort}/hello`)
  const apiBody = await apiRes.json()

  expect(apiRes.status).toEqual(200)
  expect(apiBody).toEqual({ data: 'hello function' })
}
