global.__dirname = __dirname
// Load shared mocks
import 'src/lib/test'

import path from 'path'

import { files } from '../script'

beforeAll(() => {})

test('creates a JavaScript function to execute', () => {
  const output = files({
    name: 'scriptyMcScript',
    typescript: false,
  })

  const expectedOutputPath = path.normalize(
    '/path/to/project/api/src/scripts/scriptyMcScript.js'
  )

  expect(Object.keys(output)).toContainEqual(expectedOutputPath)
  expect(output[expectedOutputPath]).toMatchSnapshot()
})

test('creates a TypeScript function to execute', () => {
  const output = files({
    name: 'typescriptyTypescript',
    typescript: true,
  })

  const expectedOutputPath = path.normalize(
    '/path/to/project/api/src/scripts/typescriptyTypescript.ts'
  )

  expect(Object.keys(output)).toContainEqual(expectedOutputPath)
  expect(output[expectedOutputPath]).toMatchSnapshot()
})
