global.__dirname = __dirname

import '../../../../lib/mockTelemetry'

jest.mock('../../../../lib', () => {
  const path = require('path')
  const __dirname = path.resolve()

  return {
    getPaths: () => ({
      api: {
        base: path.join(__dirname, '../create-redwood-app/template/api'),
        src: path.join(__dirname, '../create-redwood-app/template/api/src'),
        functions: path.join(
          __dirname,
          '../create-redwood-app/template/api/src/functions'
        ),
        lib: path.join(__dirname, '../create-redwood-app/template/api/src/lib'),
      },
      web: { src: '' },
      base: path.join(__dirname, '../create-redwood-app/template'),
    }),
  }
})

jest.mock('../../../../lib/project', () => ({
  isTypeScriptProject: () => true,
}))

import path from 'path'
import { files } from '../authFiles'

it('generates a record of files', () => {
  const filesRecord = files({ provider: 'supertokens' })

  expect(Object.keys(filesRecord)).toHaveLength(3)
  expect(
    Object.keys(filesRecord).some((filePath) =>
      filePath.endsWith('lib' + path.sep + 'auth.ts')
    )
  ).toBeTruthy()
  expect(
    Object.keys(filesRecord).some((filePath) =>
      filePath.endsWith('lib' + path.sep + 'supertokens.ts')
    )
  ).toBeTruthy()
  expect(
    Object.keys(filesRecord).some((filePath) =>
      filePath.endsWith('functions' + path.sep + 'auth.ts')
    )
  ).toBeTruthy()
})

it('generates a record of webAuthn files', () => {
  const filesRecord = files({ provider: 'dbAuth', webAuthn: true })

  expect(Object.keys(filesRecord)).toHaveLength(2)
  expect(
    Object.values(filesRecord).some((content) =>
      content.toLowerCase().includes('webauthn')
    )
  ).toBeTruthy()
  expect(
    Object.values(filesRecord).some((content) =>
      !content.toLowerCase().includes('webauthn')
    )
  ).toBeTruthy()
})
