global.__dirname = __dirname
// Load shared mocks
import '../../../../lib/test'

import path from 'path'

import { files } from '../directive'

test('creates a JavaScript validator directive', () => {
  const output = files({
    name: 'require-admin', // checking camel casing too!
    typescript: false,
    tests: true,
    type: 'validator',
  })

  const expectedOutputPath = path.normalize(
    '/path/to/project/api/src/directives/requireAdmin/requireAdmin.directive.js'
  )
  const expectedTestOutputPath = path.normalize(
    '/path/to/project/api/src/directives/requireAdmin/requireAdmin.test.js'
  )

  expect(Object.keys(output)).toContainEqual(expectedOutputPath)
  expect(Object.keys(output)).toContainEqual(expectedTestOutputPath)
  expect(output[expectedOutputPath]).toMatchSnapshot('js directive')
  expect(output[expectedTestOutputPath]).toMatchSnapshot('js directive test')
})

test('creates a TypeScript transformer directive', () => {
  const output = files({
    name: 'bazinga-foo_bar', // checking camel casing too!
    typescript: true,
    tests: true,
    type: 'transformer',
  })

  const expectedOutputPath = path.normalize(
    '/path/to/project/api/src/directives/bazingaFooBar/bazingaFooBar.directive.ts'
  )
  const expectedTestOutputPath = path.normalize(
    '/path/to/project/api/src/directives/bazingaFooBar/bazingaFooBar.test.ts'
  )

  expect(Object.keys(output)).toContainEqual(expectedOutputPath)
  expect(Object.keys(output)).toContainEqual(expectedTestOutputPath)
  expect(output[expectedOutputPath]).toMatchSnapshot('ts directive')
  expect(output[expectedTestOutputPath]).toMatchSnapshot('ts directive test')
})
