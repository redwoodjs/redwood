global.__dirname = __dirname
// Load shared mocks
import '../../../../lib/test'

import path from 'path'

import yargs from 'yargs'

import * as script from '../script'

beforeAll(() => {})

test('creates a JavaScript function to execute', () => {
  const output = script.files({
    name: 'scriptyMcScript',
    typescript: false,
  })

  const expectedOutputPath = path.normalize(
    '/path/to/project/scripts/scriptyMcScript.js'
  )

  expect(Object.keys(output)).toContainEqual(expectedOutputPath)
  expect(output[expectedOutputPath]).toMatchSnapshot()
})

test('creates a TypeScript function to execute', () => {
  const output = script.files({
    name: 'typescriptyTypescript',
    typescript: true,
  })

  const expectedOutputPath = path.normalize(
    '/path/to/project/scripts/typescriptyTypescript.ts'
  )

  const tsconfigPath = path.normalize('/path/to/project/scripts/tsconfig.json')

  const outputFilePaths = Object.keys(output)

  expect(outputFilePaths).toContainEqual(expectedOutputPath)
  expect(output[expectedOutputPath]).toMatchSnapshot()

  // Should generate tsconfig, because its not present
  expect(outputFilePaths).toContainEqual(tsconfigPath)
})

test('keeps Script in name', () => {
  const { name } = yargs
    .command('script <name>', false, script.builder)
    .parse('script BazingaScript')

  expect(name).toEqual('BazingaScript')
})
