import path from 'path'

import pino from 'pino'
import build from 'pino-abstract-transport'

import { getConfig } from '@redwoodjs/project-config'

import {
  createServer,
  resolveCreateServerOptions,
  DEFAULT_CREATE_SERVER_OPTIONS,
  parseArgs,
} from '../createServer'

// Set up RWJS_CWD.
let original_RWJS_CWD

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = path.join(__dirname, './fixtures/redwood-app')
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

describe('createServer', () => {
  // Create a server for most tests. Some that test initialization create their own
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  afterAll(async () => {
    await server?.close()
  })

  it('serves functions', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/hello',
    })

    expect(res.json()).toEqual({ data: 'hello function' })
  })

  it('warns about server.config.js', async () => {
    console.warn = jest.fn()

    await createServer()

    expect(console.warn.mock.calls[0][0]).toMatchInlineSnapshot(`
      "[33m[39m
      [33mIgnoring \`config\` and \`configureServer\` in api/server.config.js.[39m
      [33mMigrate them to api/src/server.{ts,js}:[39m
      [33m[39m
      [33m\`\`\`js title="api/src/server.{ts,js}"[39m
      [33m// Pass your config to \`createServer\`[39m
      [33mconst server = createServer({[39m
      [33m  fastifyServerOptions: myFastifyConfig[39m
      [33m})[39m
      [33m[39m
      [33m// Then inline your \`configureFastify\` logic:[39m
      [33mserver.register(myFastifyPlugin)[39m
      [33m\`\`\`[39m
      [33m[39m"
    `)
  })

  it('`apiRootPath` prefixes all routes', async () => {
    const server = await createServer({ apiRootPath: '/api' })

    const res = await server.inject({
      method: 'GET',
      url: '/api/hello',
    })

    expect(res.json()).toEqual({ data: 'hello function' })

    await server.close()
  })

  // Moving config loading up makes this trickier to test.
  it.skip('loads env files if not already loaded', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/env',
    })

    expect(res.json()).toEqual({ data: '42' })
  })

  // We use `console.log` and `.warn` to output some things.
  // Meanwhile, the server gets a logger that may not output to the same place
  // The server's logger also seems to output things out of order.
  it("doesn't handle logs consistently", async () => {
    console.log = jest.fn()
    console.warn = jest.fn()

    // Here we create a logger that outputs to an array.
    const loggerLogs: string[] = []
    const stream = build(async (source) => {
      for await (const obj of source) {
        loggerLogs.push(obj)
      }
    })
    const logger = pino(stream)

    // Generate some logs.
    const server = await createServer({ logger })
    const res = await server.inject({
      method: 'GET',
      url: '/hello',
    })
    expect(res.json()).toEqual({ data: 'hello function' })
    await server.listen({ port: 8910 })
    await server.close()

    // We expect console log to be called with `withFunctions` logs.
    expect(console.log.mock.calls[0][0]).toMatch(/Importing Server Functions/)

    const lastCallIndex = console.log.mock.calls.length - 1

    expect(console.log.mock.calls[lastCallIndex][0]).toMatch(/Listening on/)

    // `console.warn` will be used if there's a `server.config.js` file.
    expect(console.warn.mock.calls[0][0]).toMatchInlineSnapshot(`
      "[33m[39m
      [33mIgnoring \`config\` and \`configureServer\` in api/server.config.js.[39m
      [33mMigrate them to api/src/server.{ts,js}:[39m
      [33m[39m
      [33m\`\`\`js title="api/src/server.{ts,js}"[39m
      [33m// Pass your config to \`createServer\`[39m
      [33mconst server = createServer({[39m
      [33m  fastifyServerOptions: myFastifyConfig[39m
      [33m})[39m
      [33m[39m
      [33m// Then inline your \`configureFastify\` logic:[39m
      [33mserver.register(myFastifyPlugin)[39m
      [33m\`\`\`[39m
      [33m[39m"
    `)

    // Finally, the logger. Notice how the request/response logs come before the "server is listening..." logs.
    expect(loggerLogs[0]).toMatchObject({
      reqId: 'req-1',
      level: 30,
      msg: 'incoming request',
      req: {
        hostname: 'localhost:80',
        method: 'GET',
        remoteAddress: '127.0.0.1',
        url: '/hello',
      },
    })
    expect(loggerLogs[1]).toMatchObject({
      reqId: 'req-1',
      level: 30,
      msg: 'request completed',
      res: {
        statusCode: 200,
      },
    })

    expect(loggerLogs[2]).toMatchObject({
      level: 30,
      msg: 'Server listening at http://[::1]:8910',
    })
    expect(loggerLogs[3]).toMatchObject({
      level: 30,
      msg: 'Server listening at http://127.0.0.1:8910',
    })
  })

  describe('`server.start`', () => {
    it('starts the server using [api].port in redwood.toml if none is specified', async () => {
      const server = await createServer()
      await server.start()

      const address = server.server.address()

      if (!address || typeof address === 'string') {
        throw new Error('No address or address is a string')
      }

      expect(address.port).toBe(getConfig().api.port)

      await server.close()
    })

    it('the `REDWOOD_API_PORT` env var takes precedence over [api].port', async () => {
      process.env.REDWOOD_API_PORT = '8920'

      const server = await createServer()
      await server.start()

      const address = server.server.address()

      if (!address || typeof address === 'string') {
        throw new Error('No address or address is a string')
      }

      expect(address.port).toBe(+process.env.REDWOOD_API_PORT)

      await server.close()

      delete process.env.REDWOOD_API_PORT
    })
  })
})

describe('resolveCreateServerOptions', () => {
  it('nothing passed', () => {
    const resolvedOptions = resolveCreateServerOptions()

    expect(resolvedOptions).toEqual({
      apiRootPath: DEFAULT_CREATE_SERVER_OPTIONS.apiRootPath,
      fastifyServerOptions: {
        requestTimeout:
          DEFAULT_CREATE_SERVER_OPTIONS.fastifyServerOptions.requestTimeout,
        logger: DEFAULT_CREATE_SERVER_OPTIONS.logger,
      },
    })
  })

  it('ensures `apiRootPath` has slashes', () => {
    const expected = '/v1/'

    expect(
      resolveCreateServerOptions({
        apiRootPath: 'v1',
      }).apiRootPath
    ).toEqual(expected)

    expect(
      resolveCreateServerOptions({
        apiRootPath: '/v1',
      }).apiRootPath
    ).toEqual(expected)

    expect(
      resolveCreateServerOptions({
        apiRootPath: 'v1/',
      }).apiRootPath
    ).toEqual(expected)
  })

  it('moves `logger` to `fastifyServerOptions.logger`', () => {
    const resolvedOptions = resolveCreateServerOptions({
      logger: { level: 'info' },
    })

    expect(resolvedOptions).toMatchObject({
      fastifyServerOptions: {
        logger: { level: 'info' },
      },
    })
  })

  it('`logger` overwrites `fastifyServerOptions.logger`', () => {
    const resolvedOptions = resolveCreateServerOptions({
      logger: false,
      fastifyServerOptions: {
        // @ts-expect-error this is invalid TS but valid JS
        logger: true,
      },
    })

    expect(resolvedOptions).toMatchObject({
      fastifyServerOptions: {
        logger: false,
      },
    })
  })

  it('`DEFAULT_CREATE_SERVER_OPTIONS` overwrites `fastifyServerOptions.logger`', () => {
    const resolvedOptions = resolveCreateServerOptions({
      fastifyServerOptions: {
        // @ts-expect-error this is invalid TS but valid JS
        logger: true,
      },
    })

    expect(resolvedOptions).toMatchObject({
      fastifyServerOptions: {
        logger: DEFAULT_CREATE_SERVER_OPTIONS.logger,
      },
    })
  })
})

describe('parseArgs', () => {
  it('parses `--port`', () => {
    expect(parseArgs(['--port', '8930']).port).toEqual(8930)
  })

  it("throws if `--port` can't be converted to a number", () => {
    expect(() => {
      parseArgs(['--port', 'eight-nine-ten'])
    }).toThrowErrorMatchingInlineSnapshot(`"\`--port\` must be an integer"`)
  })

  it('returns an empty object if passed no args', () => {
    const args = parseArgs([])
    expect(args).toEqual({})
  })
})
