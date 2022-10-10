// Have to use `var` here to avoid "Temporal Dead Zone" issues
let mockBasePath = ''
let mockIsTypeScriptProject = true
global.__dirname = __dirname

jest.mock('../../lib/paths', () => {
  const path = require('path')

  return {
    ...jest.requireActual('../../lib/paths'),
    getPaths: () => {
      const base = mockBasePath || '/mock/base/path'

      return {
        api: {
          src: path.join(base, 'api', 'src'),
          functions: path.join(base, 'api', 'src', 'functions'),
          lib: path.join(base, 'api', 'src', 'lib'),
        },
      }
    },
  }
})

jest.mock('../../lib/project', () => ({
  isTypeScriptProject: () => mockIsTypeScriptProject,
}))

import path from 'path'

import { getPaths } from '../../lib/paths'
import { apiSideFiles, generateUniqueFileNames } from '../authFiles'

beforeEach(() => {
  mockIsTypeScriptProject = true
})

it('generates a record of TS files', () => {
  const filePaths = Object.keys(
    apiSideFiles({
      basedir: path.join(__dirname, 'fixtures/supertokensSetup'),
      webAuthn: false,
    })
  ).sort()

  expect(filePaths).toEqual([
    path.join(getPaths().api.functions, 'auth.ts'),
    path.join(getPaths().api.lib, 'auth.ts'),
    path.join(getPaths().api.lib, 'supertokens.ts'),
  ])
})

it('generates a record of JS files', () => {
  mockIsTypeScriptProject = false

  const filePaths = Object.keys(
    apiSideFiles({
      basedir: path.join(__dirname, 'fixtures/supertokensSetup'),
      webAuthn: false,
    })
  ).sort()

  expect(filePaths).toEqual([
    path.join(getPaths().api.functions, 'auth.js'),
    path.join(getPaths().api.lib, 'auth.js'),
    path.join(getPaths().api.lib, 'supertokens.js'),
  ])
})

it('generates a record of webAuthn files', () => {
  const filesRecord = apiSideFiles({
    basedir: path.join(__dirname, 'fixtures/dbAuthSetup'),
    webAuthn: true,
  })

  expect(Object.keys(filesRecord)).toHaveLength(2)
  expect(
    Object.values(filesRecord).some((content) =>
      content.toLowerCase().includes('webauthn')
    )
  ).toBeTruthy()
  expect(
    Object.values(filesRecord).some(
      (content) => !content.toLowerCase().includes('webauthn')
    )
  ).toBeTruthy()
})

it('generates new filenames to avoid overwriting existing files', () => {
  mockBasePath = path.join(__dirname, 'fixtures', 'app')

  const conflictingFilesRecord = {
    [path.join(mockBasePath, 'api', 'src', 'functions', 'auth.ts')]:
      'functions/auth.ts file content',
    [path.join(mockBasePath, 'api', 'src', 'lib', 'auth.ts')]:
      'lib/auth.ts file content',
    [path.join(mockBasePath, 'api', 'src', 'lib', 'supertokens.ts')]:
      'lib/supertokens.ts file content',
  }

  const filesRecord = generateUniqueFileNames(
    conflictingFilesRecord,
    'supertokens'
  )

  const filePaths = Object.keys(filesRecord).sort()

  expect(filePaths).toEqual([
    path.join(getPaths().api.functions, 'supertokensAuth2.ts'),
    path.join(getPaths().api.lib, 'supertokens2.ts'),
    path.join(getPaths().api.lib, 'supertokensAuth.ts'),
  ])
})
