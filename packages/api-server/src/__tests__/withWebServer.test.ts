import path from 'path'

import { FastifyInstance } from 'fastify'

import withWebServer from '../middleware/withWebServer'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('Attactches handlers for prerendered files', () => {
  const mockedApp = {
    register: jest.fn(),
    get: jest.fn(),
    setNotFoundHandler: jest.fn(),
  } as unknown as FastifyInstance

  withWebServer(mockedApp)
})
