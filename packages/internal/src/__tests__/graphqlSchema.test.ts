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

    const invocation1to8 = (console.error as jest.Mock).mock.calls.slice(0, 8)
    const invocation9 = (console.error as jest.Mock).mock.calls[8]

    expect(invocation1to8).toEqual([
      [''],
      ['Schema loading failed.', 'Unknown type: "Shelf".'],
      [''],
      ['It looks like you have a Shelf model in your database schema.'],
      ['Maybe you need to generate SDL or scaffolding for Shelf first.'],
      [''],
      [
        'See the section on troubleshooting generators ' +
          '(​https://redwoodjs.com/docs/schema-relations#troubleshooting-generators​) ' +
          'in our docs for more help',
      ],
      [''],
    ])
    expect(invocation9[0].toString()).toMatch('Error: Unknown type: "Shelf".')
  } finally {
    console.error = oldConsoleError
    delete process.env.RWJS_CWD
  }
})
