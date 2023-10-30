import fs from 'fs'
import path from 'path'

// import { getPaths } from '@redwoodjs/project-config'

import { generateClientPreset } from '../generate/clientPreset'
import { generateGraphQLSchema } from '../generate/graphqlSchema'

afterEach(() => {
  delete process.env.RWJS_CWD
  jest.restoreAllMocks()
})

describe('Generate client preset', () => {
  test('for web side', async () => {
    const FIXTURE_PATH = path.resolve(
      __dirname,
      '../../../../__fixtures__/example-todo-main'
    )

    process.env.RWJS_CWD = FIXTURE_PATH

    await generateGraphQLSchema()

    const { clientPresetFiles } = await generateClientPreset()

    expect(clientPresetFiles).toHaveLength(6)
    const expectedEndings = [
      '/fragment-masking.ts',
      '/index.ts',
      '/gql.ts',
      '/graphql.ts',
      '/persisted-documents.json',
      '/types.d.ts',
    ]

    const foundEndings = expectedEndings.filter((expectedEnding) =>
      clientPresetFiles.some((filename) => filename.endsWith(expectedEnding))
    )

    expect(foundEndings).toHaveLength(expectedEndings.length)
  })

  test('for api side', async () => {
    const FIXTURE_PATH = path.resolve(
      __dirname,
      '../../../../__fixtures__/example-todo-main'
    )

    process.env.RWJS_CWD = FIXTURE_PATH

    await generateGraphQLSchema()

    const { trustedDocumentsStoreFile } = await generateClientPreset()

    expect(trustedDocumentsStoreFile).toContain(
      'api/src/lib/trustedDocumentsStore.ts'
    )
  })
})
