global.__dirname = __dirname
import path from 'path'

import { loadGeneratorFixture } from 'src/lib/test'

import * as functionGenerator from '../function'

test('returns exactly 1 file', async () => {
  const files = await functionGenerator.files({
    name: 'Foo',
  })

  expect(Object.keys(files).length).toEqual(1)
})

test('creates a single word function file', async () => {
  const files = await functionGenerator.files({
    name: 'Foo',
  })

  expect(
    files[path.normalize('/path/to/project/api/src/functions/foo.js')]
  ).toEqual(loadGeneratorFixture('function', 'singleWord.js'))
})

test('creates a multi word function file', async () => {
  const files = await functionGenerator.files({
    name: 'SendMail',
  })

  expect(
    files[path.normalize('/path/to/project/api/src/functions/sendMail.js')]
  ).toEqual(loadGeneratorFixture('function', 'multiWord.js'))
})
