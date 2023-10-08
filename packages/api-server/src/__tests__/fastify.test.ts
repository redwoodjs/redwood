import fastify from 'fastify'
import { vol } from 'memfs'

import { createFastifyInstance, DEFAULT_OPTIONS } from '../fastify'

// Suppress terminal logging.
console.log = jest.fn()

// Set up RWJS_CWD.
let original_RWJS_CWD
const redwoodProjectPath = '/redwood-app'

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD

  process.env.RWJS_CWD = redwoodProjectPath
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

// Mock server.config.js.
jest.mock('fs', () => require('memfs').fs)

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

jest.mock('fastify', () => {
  return jest.fn(() => {
    return {
      register: () => {},
    }
  })
})

describe('createFastifyInstance', () => {
  it('instantiates a fastify instance with default config', () => {
    vol.fromNestedJSON(
      {
        'redwood.toml': '',
      },
      redwoodProjectPath
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
      redwoodProjectPath
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
