import path from 'path'

import { FastifyInstance } from 'fastify'

import withApiProxy from '../plugins/withApiProxy'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

// Mock the dist folder from fixtures,
// because its gitignored
jest.mock('@redwoodjs/internal', () => {
  return {
    ...jest.requireActual('@redwoodjs/internal'),
  }
})

jest.mock('../fastify', () => {
  return {
    ...jest.requireActual('../fastify'),
    loadFastifyConfig: jest.fn().mockReturnValue({
      config: {},
      configureFastify: jest.fn((fastify) => fastify),
    }),
  }
})

describe('Configures the ApiProxy', () => {
  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('Checks that the fastify http-proxy plugin is configured correctly', async () => {
    const mockedFastifyInstance = {
      register: jest.fn(),
      get: jest.fn(),
      all: jest.fn(),
      addContentTypeParser: jest.fn(),
      log: console,
    }

    await withApiProxy(mockedFastifyInstance as unknown as FastifyInstance, {
      apiUrl: 'http://localhost',
      apiHost: 'my-api-host',
    })

    const mockedFastifyInstanceOptions =
      mockedFastifyInstance.register.mock.calls[0][1]

    expect(mockedFastifyInstanceOptions).toEqual({
      disableCache: true,
      prefix: 'http://localhost',
      upstream: 'my-api-host',
    })
  })
})
