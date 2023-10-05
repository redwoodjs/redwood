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
  test('for web and api sides', async () => {
    const FIXTURE_PATH = path.resolve(
      __dirname,
      '../../../../__fixtures__/example-todo-main'
    )

    process.env.RWJS_CWD = FIXTURE_PATH

    await generateGraphQLSchema()

    jest
      .spyOn(fs, 'writeFileSync')
      .mockImplementation(
        (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
          expect(data).toMatchSnapshot()
        }
      )

    const { clientPresetFiles } = await generateClientPreset()

    expect(clientPresetFiles).toHaveLength(6)
    expect(clientPresetFiles).toMatchSnapshot()
  })
})
