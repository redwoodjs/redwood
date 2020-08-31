import { generateTypeDefIndex } from '../generateTypes'

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
  expect(mockWriteFileSync.mock.calls[0][0]).toContain('index.d.ts')
  expect(mockWriteFileSync.mock.calls[0][1]).toContain(
    `import-dir-service.d.ts`
  )
})
