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

const aboutHTML = '<h1>About</h1>'

jest.mock(
  '/redwood-app/api/server.config.js',
  () => {
    return {
      config: {},
      configureFastify: async (fastify, options) => {
        if (options.side === 'web') {
          fastify.get('/about', async (_request, _reply) => {
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
          fastify.get('/about', async (_request, _reply) => {
            return { virtualAboutHtml: true }
          })
        }

        return fastify
      },
    }
  },
  { virtual: true }
)

test("the user can't overwrite prerendered files", async () => {
  vol.fromNestedJSON(
    {
      'redwood.toml': '',
      api: {
        'server.config.js': '',
      },
      web: {
        dist: {
          'about.html': aboutHTML,
        },
      },
    },
    FIXTURE_PATH
  )

  try {
    await withWebServer(createFastifyInstance(), {
      port: 8910,
    })
  } catch (e) {
    expect(e.code).toBe('FST_ERR_DUPLICATED_ROUTE')
  }
})
