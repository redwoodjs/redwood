global.__dirname = __dirname
// Load shared mocks
import '../../../../lib/test'

import path from 'path'

import yargs from 'yargs'

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
    tests: true,
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

test('returns tests, scenario and function file', () => {
  const fileNames = Object.keys(singleWordDefaultFiles)
  expect(fileNames.length).toEqual(3)

  expect(fileNames).toEqual(
    expect.arrayContaining([
      expect.stringContaining('foo.js'),
      expect.stringContaining('foo.test.js'),
      expect.stringContaining('foo.scenarios.js'),
    ])
  )
})

test('Keeps Function in name', () => {
  const { name } = yargs
    .command('function <name>', false, functionGenerator.builder)
    .parse('function BazingaFunction')

  expect(name).toEqual('BazingaFunction')
})

test('creates a single word function file', () => {
  expect(
    singleWordDefaultFiles[
      path.normalize('/path/to/project/api/src/functions/foo/foo.js')
    ]
  ).toMatchSnapshot()

  expect(
    singleWordDefaultFiles[
      path.normalize('/path/to/project/api/src/functions/foo/foo.test.js')
    ]
  ).toMatchSnapshot('Test snapshot')

  expect(
    singleWordDefaultFiles[
      path.normalize('/path/to/project/api/src/functions/foo/foo.scenarios.js')
    ]
  ).toMatchSnapshot('Scenario snapshot')
})

test('creates a multi word function file', () => {
  expect(
    multiWordDefaultFiles[
      path.normalize('/path/to/project/api/src/functions/sendMail/sendMail.js')
    ]
  ).toMatchSnapshot()
})

test('creates a .js file if --javascript=true', () => {
  expect(
    javascriptFiles[
      path.normalize(
        '/path/to/project/api/src/functions/javascriptFunction/javascriptFunction.js'
      )
    ]
  ).toMatchSnapshot()
  // ^ JS-function-args should be stripped of their types and consequently the unused 'aws-lamda' import removed.
  // https://babeljs.io/docs/en/babel-plugin-transform-typescript
})

test('creates a .ts file if --typescript=true', () => {
  const fileNames = Object.keys(typescriptFiles)
  expect(fileNames.length).toEqual(3)

  expect(fileNames).toEqual(
    expect.arrayContaining([
      expect.stringContaining('typescriptFunction.ts'),
      expect.stringContaining('typescriptFunction.test.ts'),
      expect.stringContaining('typescriptFunction.scenarios.ts'),
    ])
  )

  expect(
    typescriptFiles[
      path.normalize(
        '/path/to/project/api/src/functions/typescriptFunction/typescriptFunction.ts'
      )
    ]
  ).toMatchSnapshot()
  // ^ TS-functions, on the other hand, retain the 'aws-lamda' import and type-declartions.
})
