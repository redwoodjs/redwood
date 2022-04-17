import fs from 'fs'
import path from 'path'

import { generateGraphQLSchema } from '../generate/graphqlSchema'

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

afterEach(() => {
  jest.restoreAllMocks()
})

test('Generates GraphQL schema', async () => {
  const expectedPath = path.join(FIXTURE_PATH, '.redwood', 'schema.graphql')

  jest
    .spyOn(fs, 'writeFileSync')
    .mockImplementation(
      (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
        expect(file).toMatch(expectedPath)
        expect(data).toMatchSnapshot()
      }
    )

  const schemaPath = await generateGraphQLSchema()

  expect(schemaPath).toMatch(expectedPath)
})

test('Prints error message when schema loading fails', async () => {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/graphqlCodeGen/bookshelf'
  )
  process.env.RWJS_CWD = fixturePath
  const oldConsoleError = console.error
  console.error = jest.fn()

  try {
    await generateGraphQLSchema()

    expect(console.error).toHaveBeenNthCalledWith(
      1,
      'Schema loading failed.',
      'Unknown type: "Shelf".'
    )
    expect(console.error).toHaveBeenNthCalledWith(
      3,
      'It looks like you have a Shelf model in your database schema.'
    )
    expect(console.error).toHaveBeenNthCalledWith(
      4,
      'Try running the generator you just used for that model first instead'
    )
  } finally {
    console.error = oldConsoleError
    delete process.env.RWJS_CWD
  }
})
