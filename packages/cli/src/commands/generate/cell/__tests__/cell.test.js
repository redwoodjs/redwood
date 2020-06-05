global.__dirname = __dirname
import path from 'path'

import { loadGeneratorFixture } from 'src/lib/test'

import * as cell from '../cell'

let singleWordFiles, multiWordFiles

beforeAll(() => {
  singleWordFiles = cell.files({ name: 'User' })
  multiWordFiles = cell.files({ name: 'UserProfile' })
})

test('returns exactly 2 files', () => {
  expect(Object.keys(singleWordFiles).length).toEqual(2)
})

test('creates a cell component with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize('/path/to/project/web/src/components/UserCell/UserCell.js')
    ]
  ).toEqual(loadGeneratorFixture('cell', 'singleWordCell.js'))
})

test('creates a cell test with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserCell/UserCell.test.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'singleWordCell.test.js'))
})

test('creates a cell component with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'multiWordCell.js'))
})

test('creates a cell test with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.test.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'multiWordCell.test.js'))
})
