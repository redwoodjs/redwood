import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from '../babel-plugin-redwood-import-dir'

const mockReaddirSync = jest.fn(() => [
  'import-dir-services.d.ts',
  'import-dir-graphql.d.ts',
])
const mockWriteFileSync = jest.fn()

jest.mock('@redwoodjs/structure', () => {
  return {
    DefaultHost: jest.fn().mockImplementation(() => ({
      readdirSync: mockReaddirSync,
      writeFileSync: mockWriteFileSync,
      paths: {
        types: '/fake/project/node_modules/@types/@redwoodjs/generated',
      },
    })),
  }
})

describe('babel plugin redwood import dir', () => {
  pluginTester({
    plugin,
    pluginName: 'babel-plugin-redwood-import-dir',
    fixtures: path.join(__dirname, '__fixtures__/import-dir'),
  })

  afterAll(() => {
    expect(mockWriteFileSync.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        /fake/project/node_modules/@types/@redwoodjs/generated/import-dir-services.d.ts,
        
                // @ts-expect-error
                declare module 'src/__fixtures__/**/*.{js,ts}';
              ,
      ]
    `)

    expect(mockWriteFileSync.mock.calls[1]).toMatchInlineSnapshot(`
      Array [
        /fake/project/node_modules/@types/@redwoodjs/index.d.ts,
        /// <reference path="./generated/import-dir-services.d.ts" />
      /// <reference path="./generated/import-dir-graphql.d.ts" />,
      ]
    `)

    jest.clearAllMocks()
  })
})
