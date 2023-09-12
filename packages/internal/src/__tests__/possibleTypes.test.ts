import fs from 'fs'
import path from 'path'

import { generateGraphQLSchema } from '../generate/graphqlSchema'
import { generatePossibleTypes } from '../generate/possibleTypes'

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

describe('Generate gql possible types web from the GraphQL Schema', () => {
  test('when there are *no* union types', async () => {
    await generateGraphQLSchema()

    jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(
        (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
          expect(file).toMatch(path.join('web', 'types', 'possible-types.ts'))
          expect(data).toMatchSnapshot()
        }
      )

    const { possibleTypesFiles } = await generatePossibleTypes()

    expect(possibleTypesFiles).toHaveLength(1)
    expect(possibleTypesFiles[0]).toMatch(
      path.join('web', 'types', 'possible-types.ts')
    )
  })

  test('when there are union types ', async () => {
    await generateGraphQLSchema()

    jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(
        (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
          expect(file).toMatch(path.join('web', 'types', 'possible-types.ts'))
          expect(data).toMatchSnapshot()
        }
      )

    const { possibleTypesFiles } = await generatePossibleTypes()

    expect(possibleTypesFiles).toHaveLength(1)
    expect(possibleTypesFiles[0]).toMatch(
      path.join('web', 'types', 'possible-types.ts')
    )
  })
})
