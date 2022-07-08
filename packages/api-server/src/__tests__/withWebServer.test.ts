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
  const mockedApp = {
    register: jest.fn(),
    get: jest.fn(),
    setNotFoundHandler: jest.fn(),
    log: console,
  } as unknown as FastifyInstance

  await withWebServer(mockedApp)

  expect(mockedApp.get).toHaveBeenCalledWith('/about', expect.anything())
  expect(mockedApp.get).toHaveBeenCalledWith('/mocked', expect.anything())
  expect(mockedApp.get).toHaveBeenCalledWith('/posts/new', expect.anything())

  // Ignore index.html
  expect(mockedApp.get).not.toHaveBeenCalledWith('/index', expect.anything())
})

test('Adds SPA fallback', async () => {
  const mockedApp = {
    register: jest.fn(),
    get: jest.fn(),
    setNotFoundHandler: jest.fn(),
    log: console,
  } as unknown as FastifyInstance

  await withWebServer(mockedApp)

  expect(mockedApp.setNotFoundHandler).toHaveBeenCalled()
})
