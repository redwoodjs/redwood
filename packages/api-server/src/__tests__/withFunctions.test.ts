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

test('Checks that a default configureFastifyForSide hook is called for the api side', async () => {
  const mockedFastifyInstance = {
    register: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    addContentTypeParser: jest.fn(),
    setNotFoundHandler: jest.fn(),
    log: jest.fn(),
  } as unknown as FastifyInstance

  // We're mocking a fake plugin, so don't worry about the type
  const fakeFastifyPlugin =
    'Fake bazinga plugin' as unknown as FastifyPluginCallback

  const userFastifyConfig = loadFastifyConfig()

  const configureSpy = jest.spyOn(userFastifyConfig, 'configureFastifyForSide')
  configureSpy.mockImplementation(async (fastify) => {
    fastify.register(fakeFastifyPlugin)
    fastify.version = 'bazinga'
    return fastify
  })

  const { default: withFunctions } = withFunctionsPlugin

  await withFunctions(mockedFastifyInstance, {
    apiRootPath: '/kittens',
    port: 5555,
  })

  expect(configureSpy).toHaveBeenCalledTimes(1)

  const secondArgument = configureSpy.mock.calls[0][1]
  expect(secondArgument).toStrictEqual({
    side: 'api',
    apiRootPath: '/kittens',
    port: 5555,
  })

  expect(mockedFastifyInstance.register).toHaveBeenCalledWith(
    'Fake bazinga plugin'
  )

  // Check that the same instance is returned, and not a new one
  expect(mockedFastifyInstance.version).toBe('bazinga')
})
