import path from 'path'

import { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { loadFastifyConfig } from '../fastify'
import withFunctions from '../plugins/withFunctions'

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
    loadFastifyConfig: jest.fn(),
  }
})

jest.mock('../plugins/lambdaLoader', () => {
  return {
    loadFunctionsFromDist: jest.fn(),
    lambdaRequestHandler: jest.fn(),
  }
})

describe('Checks that configureFastify is called for the api side', () => {
  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockedFastifyInstance = {
    register: jest.fn(),
    get: jest.fn((routeName) => routeName),
    all: jest.fn(),
    addContentTypeParser: jest.fn(),
    setNotFoundHandler: jest.fn(),
    log: jest.fn(),
  } as unknown as FastifyInstance

  // We're mocking a fake plugin, so don't worry about the type
  const registerCustomPlugin =
    'I was registered by the custom configureFastify function' as unknown as FastifyPluginCallback

  // Mock the load fastify config function
  ;(loadFastifyConfig as jest.Mock).mockReturnValue({
    config: {},
    configureFastify: jest.fn((fastify) => {
      fastify.register(registerCustomPlugin)

      fastify.get(
        `/rest/v1/users/get/:userId`,
        async function (request, reply) {
          const { userId } = request.params as any

          return reply.send(`Get User ${userId}!`)
        }
      )
      fastify.version = 'bazinga'
      return fastify
    }),
  })

  it('Verify that configureFastify is called with the expected side and options', async () => {
    const { configureFastify } = loadFastifyConfig()
    await withFunctions(mockedFastifyInstance, {
      apiRootPath: '/kittens',
      port: 5555,
    })

    expect(configureFastify).toHaveBeenCalledTimes(1)

    expect(configureFastify).toHaveBeenCalledWith(expect.anything(), {
      side: 'api',
      apiRootPath: '/kittens',
      port: 5555,
    })
  })

  it('Check that configureFastify registers a plugin', async () => {
    await withFunctions(mockedFastifyInstance, {
      apiRootPath: '/kittens',
      port: 5555,
    })

    expect(mockedFastifyInstance.register).toHaveBeenCalledWith(
      'I was registered by the custom configureFastify function'
    )
  })

  // Note: This tests an undocumented use of configureFastify to register a route
  it('Check that configureFastify registers a route', async () => {
    await withFunctions(mockedFastifyInstance, {
      apiRootPath: '/boots',
      port: 5554,
    })

    expect(mockedFastifyInstance.get).toHaveBeenCalledWith(
      `/rest/v1/users/get/:userId`,
      expect.any(Function)
    )
  })

  it('Check that withFunctions returns the same Fastify instance, and not a new one', async () => {
    await withFunctions(mockedFastifyInstance, {
      apiRootPath: '/bazinga',
      port: 5556,
    })

    expect(mockedFastifyInstance.version).toBe('bazinga')
  })

  it('Does not throw when configureFastify is missing from server config', () => {
    ;(loadFastifyConfig as jest.Mock).mockReturnValue({
      config: {},
      configureFastify: null,
    })

    expect(
      withFunctions(mockedFastifyInstance, {
        apiRootPath: '/bazinga',
        port: 5556,
      })
    ).resolves.not.toThrowError()
  })
})
