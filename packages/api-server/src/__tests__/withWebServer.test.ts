import path from 'path'

import { FastifyInstance } from 'fastify'

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

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('Attach handlers for prerendered files', async () => {
  const mockedFastifyInstance = {
    register: jest.fn(),
    get: jest.fn(),
    setNotFoundHandler: jest.fn(),
    log: console,
  } as unknown as FastifyInstance

  await withWebServer(mockedFastifyInstance)

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

  await withWebServer(mockedFastifyInstance)

  expect(mockedFastifyInstance.setNotFoundHandler).toHaveBeenCalled()
})

test('Checks that a default configureFastifyForSide hook is called for the web side', async () => {
  const mockedFastifyInstance = {
    register: jest.fn(),
    get: jest.fn(),
    setNotFoundHandler: jest.fn(),
    log: console,
  } as unknown as FastifyInstance

  await withWebServer(mockedFastifyInstance) // ?
  const log = mockedFastifyInstance['log']['_buffer']

  const messages = log.map((item) => item['message'])

  expect(messages).toContain(
    "{ side: 'web' } In configureFastifyForSide hook for side: web"
  )
})

// TODO: test with a fixture app that has an actual custom config
