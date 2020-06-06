global.__dirname = __dirname
import path from 'path'

import { loadGeneratorFixture } from 'src/lib/test'

import * as layout from '../layout'

let singleWordFiles, multiWordFiles

beforeAll(() => {
  singleWordFiles = layout.files({ name: 'App' })
  multiWordFiles = layout.files({ name: 'SinglePage' })
})

test('returns exactly 2 files', () => {
  expect(Object.keys(singleWordFiles).length).toEqual(2)
})

test('creates a single word layout component', () => {
  expect(
    singleWordFiles[
      path.normalize('/path/to/project/web/src/layouts/AppLayout/AppLayout.js')
    ]
  ).toEqual(loadGeneratorFixture('layout', 'singleWordLayout.js'))
})

test('creates a single word layout test', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/AppLayout/AppLayout.test.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'singleWordLayout.test.js'))
})

test('creates a multi word layout component', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/SinglePageLayout/SinglePageLayout.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'multiWordLayout.js'))
})

test('creates a multi word layout test', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/layouts/SinglePageLayout/SinglePageLayout.test.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('layout', 'multiWordLayout.test.js'))
})
