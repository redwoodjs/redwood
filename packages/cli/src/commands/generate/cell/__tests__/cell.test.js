global.__dirname = __dirname
import path from 'path'

import { loadGeneratorFixture } from 'src/lib/test'

jest.mock('@redwoodjs/structure', () => {
  return {
    getProject: () => ({
      cells: [{ queryOperationName: undefined }],
    }),
  }
})

import * as cell from '../cell'

let singleWordFiles, multiWordFiles

beforeAll(() => {
  singleWordFiles = cell.files({ name: 'User' })
  multiWordFiles = cell.files({ name: 'UserProfile' })
})

test('returns exactly 4 files', () => {
  expect(Object.keys(singleWordFiles).length).toEqual(4)
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

test('creates a cell stories with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserCell/UserCell.stories.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'singleWordCell.stories.js'))
})

test('creates a cell mock with a single word name', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserCell/UserCell.mock.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'singleWordCell.mock.js'))
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

test('creates a cell stories with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.stories.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'multiWordCell.stories.js'))
})

test('creates a cell mock with a multi word name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.mock.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('cell', 'multiWordCell.mock.js'))
})
