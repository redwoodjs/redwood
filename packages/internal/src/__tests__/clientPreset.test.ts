import fs from 'fs'
import path from 'path'

// import { getPaths } from '@redwoodjs/project-config'

import { generateClientPreset } from '../generate/clientPreset'
import { generateGraphQLSchema } from '../generate/graphqlSchema'

afterEach(() => {
  delete process.env.RWJS_CWD
  jest.restoreAllMocks()
})

describe('Generate client preset from the GraphQL Schema', () => {
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

    const files = await generateClientPreset() // ?

    expect(files).toHaveLength(2)

    console.debug('clietn present files', files)

    expect(files).toHaveLength(1)

    // expect(typedDocumentsFiles[0]).toMatch(
    //   path.join(getPaths().web.graphql, 'persistedOperations.json')
    // )
    // expect(typedDocumentsFiles[1]).toMatch(
    //   path.join(getPaths().api.lib, 'persistedOperations.json')
    // )
  })

  // test('when there are union types ', async () => {
  //   const FIXTURE_PATH = path.resolve(
  //     __dirname,
  //     '../../../../__fixtures__/fragment-test-project'
  //   )

  //   process.env.RWJS_CWD = FIXTURE_PATH
  //   await generateGraphQLSchema()

  //   // note that the data for api and web side are the same
  //   jest
  //     .spyOn(fs, 'writeFileSync')
  //     .mockImplementation(
  //       (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
  //         expect(data).toMatchSnapshot()
  //       }
  //     )

  //   const { typedDocumentsFiles } = await generateTypedDocuments()

  //   expect(typedDocumentsFiles).toHaveLength(2)
  //   expect(typedDocumentsFiles[0]).toMatch(
  //     path.join(getPaths().web.graphql, 'persistedOperations.json')
  //   )
  //   expect(typedDocumentsFiles[1]).toMatch(
  //     path.join(getPaths().api.lib, 'persistedOperations.json')
  //   )
  // })
})
