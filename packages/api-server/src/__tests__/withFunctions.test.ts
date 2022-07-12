import path from 'path'

import { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { loadFastifyConfig } from '../fastify'
import * as withFunctionsPlugin from '../plugins/withFunctions'

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
      configureFastifyForSide: jest.fn((fastify) => fastify),
    }),
  }
})

jest.mock('../plugins/lambdaLoader', () => {
  return {
    loadFunctionsFromDist: jest.fn(),
    lambdaRequestHandler: jest.fn(),
  }
})

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Checks that configureFastifyForSide is called for the api side', () => {
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
    'I was registered by the custom configureFastifyForSide function' as unknown as FastifyPluginCallback

  const userFastifyConfig = loadFastifyConfig()

  const configureSpy = jest.spyOn(userFastifyConfig, 'configureFastifyForSide')
  configureSpy.mockImplementation(async (fastify) => {
    fastify.register(registerCustomPlugin)
    fastify.get(`/rest/v1/users/get/:userId`, async function (request, reply) {
      const { userId } = request.params as any

      return reply.send(`Get User ${userId}!`)
    })
    fastify.version = 'bazinga'
    return fastify
  })

  test('Verify that configureFastifyForSide is called with the expected side and options', async () => {
    const { default: withFunctions } = withFunctionsPlugin

    await withFunctions(mockedFastifyInstance, {
      apiRootPath: '/kittens',
      port: 5555,
    })

    expect(configureSpy).toHaveBeenCalledTimes(1)

    const mockedFastifyInstanceOptions = configureSpy.mock.calls[0][1]

    expect(mockedFastifyInstanceOptions).toStrictEqual({
      side: 'api',
      apiRootPath: '/kittens',
      port: 5555,
    })
  })

  test('Check that configureFastifyForSide registers a plugin', async () => {
    const { default: withFunctions } = withFunctionsPlugin

    await withFunctions(mockedFastifyInstance, {
      apiRootPath: '/kittens',
      port: 5555,
    })

    expect(mockedFastifyInstance.register).toHaveBeenCalledWith(
      'I was registered by the custom configureFastifyForSide function'
    )
  })

  test('Check that configureFastifyForSide registers a route', async () => {
    const { default: withFunctions } = withFunctionsPlugin

    await withFunctions(mockedFastifyInstance, {
      apiRootPath: '/boots',
      port: 5554,
    })

    expect(mockedFastifyInstance.get).toHaveBeenCalledWith(
      `/rest/v1/users/get/:userId`,
      expect.any(Function)
    )
  })

  test('Check that withFunctions returns the same Fastify instance, and not a new one', async () => {
    const { default: withFunctions } = withFunctionsPlugin

    await withFunctions(mockedFastifyInstance, {
      apiRootPath: '/bazinga',
      port: 5556,
    })

    expect(mockedFastifyInstance.version).toBe('bazinga')
  })
})
