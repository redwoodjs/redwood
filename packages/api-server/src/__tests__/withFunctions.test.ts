import path from 'path'

import { FastifyInstance } from 'fastify'

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

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  delete process.env.RWJS_CWD
})

test('Checks that a default configureFastifyForSide hook is called for the api side', async () => {
  const mockedFastifyInstance = {
    register: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    addContentTypeParser: jest.fn(),
    log: console,
  } as unknown as FastifyInstance

  await withFunctions(mockedFastifyInstance, '.redwood/functions') // ?

  const log = mockedFastifyInstance['log']['_buffer']

  const messages = log.map((item) => item['message'])

  expect(messages).toContain(
    "{ side: 'api' } In configureFastifyForSide hook for side: api"
  )
})

// TODO: test with a fixture app that has an actual custom config
