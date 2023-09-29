import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/project-config'

import { generateGraphQLSchema } from '../generate/graphqlSchema'
import { generatePersistedOperations } from '../generate/persistedOperations'

afterEach(() => {
  delete process.env.RWJS_CWD
  jest.restoreAllMocks()
})

describe('Generate gql persisted operations from the GraphQL Schema', () => {
  test('when there are *no* union types', async () => {
    const FIXTURE_PATH = path.resolve(
      __dirname,
      '../../../../__fixtures__/example-todo-main'
    )

    process.env.RWJS_CWD = FIXTURE_PATH

    await generateGraphQLSchema()

    // note that the data for api and web side are the same
    jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(
        (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
          expect(data).toMatchSnapshot()
        }
      )

    const { persistedOperationsFiles } = await generatePersistedOperations()

    expect(persistedOperationsFiles).toHaveLength(2)

    console.debug('persistedOperationsFiles', persistedOperationsFiles)

    expect(persistedOperationsFiles[0]).toMatch(
      path.join(getPaths().web.graphql, 'persistedOperations.json')
    )
    expect(persistedOperationsFiles[1]).toMatch(
      path.join(getPaths().api.lib, 'persistedOperations.json')
    )
  })

  test('when there are union types ', async () => {
    const FIXTURE_PATH = path.resolve(
      __dirname,
      '../../../../__fixtures__/fragment-test-project'
    )

    process.env.RWJS_CWD = FIXTURE_PATH
    await generateGraphQLSchema()

    // note that the data for api and web side are the same
    jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(
        (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
          expect(data).toMatchSnapshot()
        }
      )

    const { persistedOperationsFiles } = await generatePersistedOperations()

    expect(persistedOperationsFiles).toHaveLength(2)
    expect(persistedOperationsFiles[0]).toMatch(
      path.join(getPaths().web.graphql, 'persistedOperations.json')
    )
    expect(persistedOperationsFiles[1]).toMatch(
      path.join(getPaths().api.lib, 'persistedOperations.json')
    )
  })
})
