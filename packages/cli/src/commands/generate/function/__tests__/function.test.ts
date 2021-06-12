global.__dirname = __dirname
import path from 'path'

// Load shared mocks
import '../../../../lib/test'

import * as functionGenerator from '../function'

// Should be refactored as it's repeated
type WordFilesType = { [key: string]: string }

let singleWordDefaultFiles: WordFilesType
let multiWordDefaultFiles: WordFilesType
let javascriptFiles: WordFilesType
let typescriptFiles: WordFilesType

beforeAll(() => {
  singleWordDefaultFiles = functionGenerator.files({
    name: 'foo',
  })
  multiWordDefaultFiles = functionGenerator.files({
    name: 'send-mail',
  })
  javascriptFiles = functionGenerator.files({
    name: 'javascript-function',
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
      path.normalize('/path/to/project/api/src/functions/foo.js')
    ]
  ).toMatchSnapshot()
})

test('creates a multi word function file', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize('/path/to/project/api/src/functions/sendMail.js')
    ]
  ).toMatchSnapshot()
})

test('creates a .js file if --javascript=true', () => {
  expect(
    javascriptFiles[
      path.normalize('/path/to/project/api/src/functions/javascriptFunction.js')
    ]
  ).toMatchSnapshot()
  // ^ JS-function-args should be stripped of their types and consequently the unused 'aws-lamda' import removed.
  // https://babeljs.io/docs/en/babel-plugin-transform-typescript
})

test('creates a .ts file if --typescript=true', () => {
  expect(
    typescriptFiles[
      path.normalize('/path/to/project/api/src/functions/typescriptFunction.ts')
    ]
  ).toMatchSnapshot()
  // ^ TS-functions, on the other hand, retain the 'aws-lamda' import and type-declartions.
})
