import { describe, expect, it } from 'vitest'
import { $ } from 'zx'

import { rw, rwServer, sleep, test, testContext } from './vitest.setup.mjs'

describe.each([[[rw, 'serve']], [rwServer]])('serve both (%s)', (cmd) => {
  describe('apiPort', () => {
    it("`--apiPort` changes the api server's port", async () => {
      const apiPort = 8920
      testContext.p = $`yarn node ${cmd} --apiPort ${apiPort}`
      await test({ apiPort })
    })

    it("`REDWOOD_API_PORT` changes the api server's port", async () => {
      process.env.REDWOOD_API_PORT = '8921'
      const apiPort = +process.env.REDWOOD_API_PORT
      testContext.p = $`yarn node ${cmd}`
      await test({ apiPort })
      delete process.env.REDWOOD_API_PORT
    })

    it('`--apiPort` takes precedence over `REDWOOD_API_PORT`', async () => {
      const apiPort = 8922
      process.env.REDWOOD_API_PORT = '8923'
      testContext.p = $`yarn node ${cmd} --apiPort ${apiPort}`
      await test({ apiPort })
      delete process.env.REDWOOD_API_PORT
    })

    it('`[api].port` changes the port', async () => {
      testContext.p = $`yarn node ${cmd}`
      await test({ apiPort: testContext.projectConfig?.api.port })
    })
  })

  describe('apiHost', () => {
    it("`--apiHost` changes the api server's host", async () => {
      const apiHost = '127.0.0.1'
      testContext.p = $`yarn node ${cmd} --apiHost ${apiHost}`
      await test({ apiHost })
    })

    it("`REDWOOD_API_HOST` changes the api server's host", async () => {
      process.env.REDWOOD_API_HOST = '::1'
      const apiHost = process.env.REDWOOD_API_HOST
      testContext.p = $`yarn node ${cmd}`
      await test({ apiHost })
      delete process.env.REDWOOD_API_HOST
    })

    it('`--apiHost` takes precedence over `REDWOOD_API_HOST`', async () => {
      const apiHost = '::'
      process.env.REDWOOD_API_HOST = '0.0.0.0'
      testContext.p = $`yarn node ${cmd} --apiHost ${apiHost}`
      await test({ apiHost })
      delete process.env.REDWOOD_API_HOST
    })

    it("`[api].host` changes the api server's host", async () => {
      const originalHost = testContext.projectConfig?.api.host
      testContext.projectConfig.api.host = '127.0.0.1'
      testContext.p = $`yarn node ${cmd}`
      await test()
      testContext.projectConfig.api.host = originalHost
    })

    it("defaults to '::' if `NODE_ENV` isn't production", async () => {
      testContext.p = $`yarn node ${cmd}`
      await test()
    })

    it("defaults to '0.0.0.0' if `NODE_ENV` is production", async () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      testContext.p = $`yarn node ${cmd}`
      await test({ webHost: '0.0.0.0', apiHost: '0.0.0.0' })
      process.env.NODE_ENV = originalNodeEnv
    })
  })

  describe('apiRootPath', () => {
    it('`--apiRootPath` changes the api root path', async () => {
      const apiRootPath = '/api'
      testContext.p = $`yarn node ${cmd} --apiRootPath ${apiRootPath}`
      await test({ apiRootPath })
    })
  })

  it('loads env vars', async () => {
    testContext.p = $`yarn node ${cmd}`
    await sleep(2000)
    const res = await fetch('http://[::]:8911/env')
    const body = await res.json()
    expect(res.status).toEqual(200)
    expect(body).toEqual({ data: '42' })
  })
})
