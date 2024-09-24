import { describe, it } from 'vitest'
import { $ } from 'zx'

import { rw, rwServer, test, testContext } from './vitest.setup.mjs'

describe.each([[[rw, 'serve']], [rwServer]])('serve both (%s)', (cmd) => {
  describe('webPort', () => {
    it("`--webPort` changes the web server's port", async () => {
      const webPort = 8920
      testContext.p = $`yarn node ${cmd} --webPort ${webPort}`
      await test({ webPort })
    })

    it("`REDWOOD_WEB_PORT` changes the web server's port", async () => {
      process.env.REDWOOD_WEB_PORT = '8921'
      const webPort = +process.env.REDWOOD_WEB_PORT
      testContext.p = $`yarn node ${cmd}`
      await test({ webPort })
      delete process.env.REDWOOD_WEB_PORT
    })

    it('`--webPort` takes precedence over `REDWOOD_WEB_PORT`', async () => {
      const webPort = 8922
      process.env.REDWOOD_WEB_PORT = '8923'
      testContext.p = $`yarn node ${cmd} --webPort ${webPort}`
      await test({ webPort })
      delete process.env.REDWOOD_WEB_PORT
    })

    it('`[web].port` changes the port', async () => {
      testContext.p = $`yarn node ${cmd}`
      await test({ webPort: testContext.projectConfig?.web.port })
    })
  })

  describe('webHost', () => {
    it("`--webHost` changes the web server's host", async () => {
      const webHost = '127.0.0.1'
      testContext.p = $`yarn node ${cmd} --webHost ${webHost}`
      await test({ webHost })
    })

    it("`REDWOOD_WEB_HOST` changes the web server's host", async () => {
      process.env.REDWOOD_WEB_HOST = '::1'
      const webHost = process.env.REDWOOD_WEB_HOST
      testContext.p = $`yarn node ${cmd}`
      await test({ webHost })
      delete process.env.REDWOOD_WEB_HOST
    })

    it('`--webHost` takes precedence over `REDWOOD_WEB_HOST`', async () => {
      const webHost = '::'
      process.env.REDWOOD_WEB_HOST = '0.0.0.0'
      testContext.p = $`yarn node ${cmd} --webHost ${webHost}`
      await test({ webHost })
      delete process.env.REDWOOD_WEB_HOST
    })

    it("`[web].host` changes the web server's host", async () => {
      const originalHost = testContext.projectConfig?.web.host
      testContext.projectConfig.web.host = '127.0.0.1'
      testContext.p = $`yarn node ${cmd}`
      await test()
      testContext.projectConfig.web.host = originalHost
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
})
