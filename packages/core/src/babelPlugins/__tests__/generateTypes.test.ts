import { generateTypeDefIndex, generateTypeDef } from '../generateTypes'

const mockReaddirSync = jest.fn(() => [
  'import-dir-service.d.ts',
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

test('generates index.d.ts file correctly', () => {
  generateTypeDefIndex()

  expect(mockWriteFileSync.mock.calls[0][0]).toMatchInlineSnapshot(
    `"/fake/project/node_modules/@types/@redwoodjs/index.d.ts"`
  )
  expect(mockWriteFileSync.mock.calls[0][1]).toMatchInlineSnapshot(`
    "/// <reference path=\\"./generated/import-dir-service.d.ts\\" />
    /// <reference path=\\"./generated/import-dir-graphql.d.ts\\" />"
  `)
})
