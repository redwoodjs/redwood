import { vol } from 'memfs'

import { createFastifyInstance } from '../fastify'
import withWebServer from '../plugins/withWebServer'

// Suppress terminal logging.
console.log = jest.fn()

// Set up RWJS_CWD.
let original_RWJS_CWD
const FIXTURE_PATH = '/redwood-app'

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = FIXTURE_PATH
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

// Mock server.config.js.
jest.mock('fs', () => require('memfs').fs)

jest.mock(
  '/redwood-app/api/server.config.js',
  () => {
    return {
      config: {},
      configureFastify: async (fastify, options) => {
        if (options.side === 'web') {
          fastify.get('/about.html', async (_request, _reply) => {
            return { virtualAboutHtml: true }
          })
        }

        return fastify
      },
    }
  },
  { virtual: true }
)

jest.mock(
  '\\redwood-app\\api\\server.config.js',
  () => {
    return {
      config: {},
      configureFastify: async (fastify, options) => {
        if (options.side === 'web') {
          fastify.get('/about.html', async (_request, _reply) => {
            return { virtualAboutHtml: true }
          })
        }

        return fastify
      },
    }
  },
  { virtual: true }
)

test("the user can overwrite static files that weren't set specifically ", async () => {
  vol.fromNestedJSON(
    {
      'redwood.toml': '',
      api: {
        'server.config.js': '',
      },
      web: {
        dist: {
          'about.html': '<h1>About</h1>',
        },
      },
    },
    FIXTURE_PATH
  )

  const fastifyInstance = await withWebServer(createFastifyInstance(), {
    port: 8910,
  })

  const res = await fastifyInstance.inject({
    method: 'GET',
    url: '/about.html',
  })

  expect(res.statusCode).toBe(200)
  expect(res.body).toBe(JSON.stringify({ virtualAboutHtml: true }))

  await fastifyInstance.close()
})
