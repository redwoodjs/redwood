import path from 'path'

import { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { loadFastifyConfig } from '../fastify'
import withWebServer from '../plugins/withWebServer'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

// Mock the dist folder from fixtures,
// because its gitignored
jest.mock('@redwoodjs/internal', () => {
  return {
    ...jest.requireActual('@redwoodjs/internal'),
    findPrerenderedHtml: () => {
      return ['about.html', 'mocked.html', 'posts/new.html', 'index.html']
    },
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

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

beforeEach(() => {
  jest.clearAllMocks()
})

test('Attach handlers for prerendered files', async () => {
  const mockedFastifyInstance = {
    register: jest.fn(),
    get: jest.fn(),
    setNotFoundHandler: jest.fn(),
    log: console,
  } as unknown as FastifyInstance

  await withWebServer(mockedFastifyInstance, { port: 3000 })

  expect(mockedFastifyInstance.get).toHaveBeenCalledWith(
    '/about',
    expect.anything()
  )
  expect(mockedFastifyInstance.get).toHaveBeenCalledWith(
    '/mocked',
    expect.anything()
  )
  expect(mockedFastifyInstance.get).toHaveBeenCalledWith(
    '/posts/new',
    expect.anything()
  )

  // Ignore index.html
  expect(mockedFastifyInstance.get).not.toHaveBeenCalledWith(
    '/index',
    expect.anything()
  )
})

test('Adds SPA fallback', async () => {
  const mockedFastifyInstance = {
    register: jest.fn(),
    get: jest.fn(),
    setNotFoundHandler: jest.fn(),
    log: console,
  } as unknown as FastifyInstance

  await withWebServer(mockedFastifyInstance, { port: 3000 })

  expect(mockedFastifyInstance.setNotFoundHandler).toHaveBeenCalled()
})

test('Checks that a default configureFastifyForSide hook is called for the web side', async () => {
  const mockedFastifyInstance = {
    register: jest.fn(),
    get: jest.fn(),
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

  await withWebServer(mockedFastifyInstance, { port: 3000 })

  expect(configureSpy).toHaveBeenCalledTimes(1)

  const secondArgument = configureSpy.mock.calls[0][1]
  expect(secondArgument).toStrictEqual({
    side: 'web',
    port: 3000,
  })

  expect(mockedFastifyInstance.register).toHaveBeenCalledWith(
    'Fake bazinga plugin'
  )

  // Check that the same instance is returned, and not a new one
  expect(mockedFastifyInstance.version).toBe('bazinga')
})
