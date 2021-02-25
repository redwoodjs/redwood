global.__dirname = __dirname
import path from 'path'

// Referenced from ../components/__tests__

// Pending full TS support
import { loadGeneratorFixture } from 'src/lib/test'

// TODO: Revert to import from '../function' when it gets types.
import * as functionGenerator from 'src/commands/generate/function/function'

// Should be refactored as it's repeated
type WordFilesType = { [key: string]: string }

let singleWordDefaultFiles: WordFilesType
let multiWordDefaultFiles: WordFilesType
let javascriptFiles: WordFilesType
let typescriptFiles: WordFilesType

beforeAll(() => {
  singleWordDefaultFiles = functionGenerator.files({
    name: 'foo',
    javascript: true, // Does not respect default value; explicitly define it.
  })
  multiWordDefaultFiles = functionGenerator.files({
    name: 'send-mail',
    javascript: true, // Does not respect default value; explicitly define it.
  })
  javascriptFiles = functionGenerator.files({
    name: 'javascript-function',
    javascript: true,
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
  ).toEqual(loadGeneratorFixture('function', 'singleWord.js'))
})

test('creates a multi word function file', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize('/path/to/project/api/src/functions/sendMail.js')
    ]
  ).toEqual(loadGeneratorFixture('function', 'multiWord.js'))
})

test('creates a .js file if --javascript=true', () => {
  expect(
    javascriptFiles[
      path.normalize('/path/to/project/api/src/functions/javascriptFunction.js')
    ]
  ).toEqual(loadGeneratorFixture('function', 'jsFunc.js'))
  // ^ JS-function-args should be stripped of their types and consequently the unused 'aws-lamda' import removed.
  // https://babeljs.io/docs/en/babel-plugin-transform-typescript
})

test('creates a .ts file if --typescript=true', () => {
  expect(
    typescriptFiles[
      path.normalize('/path/to/project/api/src/functions/typescriptFunction.js')
    ]
  ).toEqual(loadGeneratorFixture('function', 'tsFunc.ts'))
  // ^ TS-functions, on the other hand, retain the 'aws-lamda' import and type-declartions.
})
