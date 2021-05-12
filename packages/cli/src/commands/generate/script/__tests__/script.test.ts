global.__dirname = __dirname
import path from 'path'

// Load shared mocks
import 'src/lib/test'

import * as functionGenerator from '../script'

// Should be refactored as it's repeated
type WordFilesType = { [key: string]: string }

let singleWordDefaultFiles: WordFilesType
let multiWordDefaultFiles: WordFilesType
let typescriptFiles: WordFilesType

beforeAll(() => {
  singleWordDefaultFiles = functionGenerator.files({
    name: 'foo',
  })
  multiWordDefaultFiles = functionGenerator.files({
    name: 'send-mail',
  })
  typescriptFiles = functionGenerator.files({
    name: 'typescript-function',
    typescript: true,
  })
})

test('returns exactly 1 file', () => {
  expect(Object.keys(singleWordDefaultFiles).length).toEqual(1)
})

test('creates a single word function file', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize('/path/to/project/api/scripts/foo.js')
    ]
  ).toMatchSnapshot()
})

test('creates a multi word function file', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize('/path/to/project/api/scripts/send-mail.js')
    ]
  ).toMatchSnapshot()
})

test('creates a .ts file if --typescript=true', () => {
  expect(
    typescriptFiles[
      path.normalize('/path/to/project/api/scripts/typescript-function.ts')
    ]
  ).toMatchSnapshot()
})
