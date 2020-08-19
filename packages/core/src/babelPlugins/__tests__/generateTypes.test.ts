import { generateTypeDefIndex } from '../generateTypes'
import { Host } from '@redwoodjs/structure'

test('that it reads the generated types and writes the index file correctly', () => {
  const fakeHost = {
    readdirSync: () => ['import-dir-services.d.ts', 'import-dir-graphql.d.ts'],
    writeFileSync: jest.fn(),
  }

  generateTypeDefIndex({
    // @ts-expect-error
    host: fakeHost,
    genTypesPath: '/fake/project/node_modules/@types/@redwoodjs/generated',
  })

  expect(fakeHost.writeFileSync).toBeCalledTimes(1)
  expect(fakeHost.writeFileSync.mock.calls[0][0]).toMatchInlineSnapshot(
    `"/fake/project/node_modules/@types/@redwoodjs/index.d.ts"`
  )
  expect(fakeHost.writeFileSync.mock.calls[0][1]).toMatchInlineSnapshot(`
    "/// <reference path=\\"./generated/import-dir-services.d.ts\\" />
    /// <reference path=\\"./generated/import-dir-graphql.d.ts\\" />"
  `)
})
