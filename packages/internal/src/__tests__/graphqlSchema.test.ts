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
