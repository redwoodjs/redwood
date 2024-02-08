import path from 'path'

import { generateClientPreset } from '../generate/clientPreset'
import { generateGraphQLSchema } from '../generate/graphqlSchema'

let shouldGenerateTrustedDocuments = false

const mockTrustedDocumentsConfig = () => {
  return shouldGenerateTrustedDocuments
}

jest.mock('@redwoodjs/project-config', () => {
  const projectConfig = jest.requireActual('@redwoodjs/project-config')

  return {
    ...projectConfig,
    getConfig: () => {
      return { graphql: { trustedDocuments: mockTrustedDocumentsConfig() } }
    },
  }
})
beforeEach(() => {
  const FIXTURE_PATH = path.resolve(
    __dirname,
    '../../../../__fixtures__/example-todo-main'
  )

  process.env.RWJS_CWD = FIXTURE_PATH
})

afterEach(() => {
  delete process.env.RWJS_CWD
  jest.restoreAllMocks()
})

describe('Generate client preset', () => {
  test('for web side', async () => {
    shouldGenerateTrustedDocuments = true
    await generateGraphQLSchema()

    const { clientPresetFiles } = await generateClientPreset()

    expect(clientPresetFiles).toHaveLength(5)
    const expectedEndings = [
      '/fragment-masking.ts',
      '/index.ts',
      '/gql.ts',
      '/graphql.ts',
      '/persisted-documents.json',
    ]

    const foundEndings = expectedEndings.filter((expectedEnding) =>
      clientPresetFiles.some((filename) => filename.endsWith(expectedEnding))
    )

    expect(foundEndings).toHaveLength(expectedEndings.length)
  })

  test('for api side', async () => {
    shouldGenerateTrustedDocuments = true
    await generateGraphQLSchema()

    const { trustedDocumentsStoreFile } = await generateClientPreset()

    expect(trustedDocumentsStoreFile).toContain('trustedDocumentsStore.ts')
  })
})
