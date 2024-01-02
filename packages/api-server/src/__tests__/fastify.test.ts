import fastify from 'fastify'
import { vol } from 'memfs'

import { createFastifyInstance, DEFAULT_OPTIONS } from '../fastify'

// We'll be testing how fastify is instantiated, so we'll mock it here.
jest.mock('fastify', () => {
  return jest.fn(() => {
    return {
      register: () => {},
      addHook: () => {},
    }
  })
})

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

// Mock server.config.js to test instantiating fastify with user config.
jest.mock('fs', () => require('memfs').fs)

afterEach(() => {
  vol.reset()
})

const userConfig = {
  requestTimeout: 25_000,
}

jest.mock(
  '/redwood-app/api/server.config.js',
  () => {
    return {
      config: userConfig,
    }
  },
  {
    virtual: true,
  }
)

jest.mock(
  '\\redwood-app\\api\\server.config.js',
  () => {
    return {
      config: userConfig,
    }
  },
  {
    virtual: true,
  }
)

describe('createFastifyInstance', () => {
  it('instantiates a fastify instance with default config', () => {
    vol.fromNestedJSON(
      {
        'redwood.toml': '',
      },
      FIXTURE_PATH
    )

    createFastifyInstance()
    expect(fastify).toHaveBeenCalledWith(DEFAULT_OPTIONS)
  })

  it("instantiates a fastify instance with the user's configuration if available", () => {
    vol.fromNestedJSON(
      {
        'redwood.toml': '',
        api: {
          'server.config.js': '',
        },
      },
      FIXTURE_PATH
    )

    createFastifyInstance()
    expect(fastify).toHaveBeenCalledWith(userConfig)
  })
})

test('DEFAULT_OPTIONS configures the log level based on NODE_ENV', () => {
  expect(DEFAULT_OPTIONS).toMatchInlineSnapshot(`
    {
      "logger": {
        "level": "info",
      },
    }
  `)
})
